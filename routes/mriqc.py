from flask import Blueprint, request, jsonify, send_file, send_from_directory
import os
import docker
from routes.mriqc_utils import (
    ensure_bids_valid,
    validate_classification_files,
    get_modality_command,
    remove_old_container,
    wait_and_verify_container,
    get_container_logs,
    find_html_reports,
    get_mriqc_status
)

mriqc_bp = Blueprint('mriqc', __name__)


@mriqc_bp.route('/api/run_mriqc', methods=['POST'])
def run_mriqc():
    """Run MRIQC quality control on BIDS data"""
    data = request.get_json()
    folder_name = data.get('folder_name')
    subject_id = data.get('subject_id', '01')
    classification = data.get('classification')
    
    print(f"MRIQC REQUEST: folder={folder_name}, subject={subject_id}, classification={classification}")
    
    if not folder_name:
        return jsonify({'status': 'error', 'message': 'Folder name required'}), 400
    
    bids_dir = os.path.join(folder_name, 'bids_output')
    
    if not os.path.exists(bids_dir):
        return jsonify({'status': 'error', 'message': 'BIDS directory not found'}), 404
    
    # Validate classification files exist
    if classification and classification != 'all':
        success, error_msg, file_count = validate_classification_files(bids_dir, subject_id, classification)
        if not success:
            return jsonify({'status': 'error', 'message': error_msg}), 404
    
    # Setup directories
    if classification and classification != 'all':
        mriqc_dir = os.path.join(folder_name, f'mriqc_output_{classification}')
        work_dir = os.path.join(folder_name, f'mriqc_work_{classification}')
        container_name = f'mriqc_{folder_name}_{classification}'
    else:
        mriqc_dir = os.path.join(folder_name, 'mriqc_output')
        work_dir = os.path.join(folder_name, 'mriqc_work')
        container_name = f'mriqc_{folder_name}'
    
    # Ensure BIDS is valid
    desc_file = os.path.join(bids_dir, 'dataset_description.json')
    if not os.path.exists(desc_file):
        print("Creating dataset_description.json")
        ensure_bids_valid(bids_dir)
    
    try:
        # Create output directories
        os.makedirs(mriqc_dir, exist_ok=True)
        os.makedirs(work_dir, exist_ok=True)
        
        # Create running indicator file
        running_file = os.path.join(mriqc_dir, '.mriqc_running')
        with open(running_file, 'w') as f:
            f.write('running')
        
        # Remove old container if exists
        remove_old_container(container_name)
        
        # Build MRIQC command
        mriqc_command = [
            "/data", "/out", "participant",
            "--participant-label", subject_id,
            "-w", "/work",
            "--no-sub"
        ]
        
        # Add modality filter if needed
        modalities, error = get_modality_command(classification)
        if error:
            if os.path.exists(running_file):
                os.remove(running_file)
            return jsonify({'status': 'error', 'message': error}), 400
        
        if modalities:
            mriqc_command.append('--modalities')
            mriqc_command.extend(modalities)
        
        # Get Docker client and image
        docker_client = docker.from_env()
        mriqc_image = "nipreps/mriqc:latest"
        
        try:
            docker_client.images.get(mriqc_image)
        except docker.errors.ImageNotFound:
            docker_client.images.pull(mriqc_image)
        
        # Get absolute paths
        bids_abs = os.path.abspath(bids_dir)
        output_abs = os.path.abspath(mriqc_dir)
        work_abs = os.path.abspath(work_dir)
        
        print(f"Starting MRIQC container...")
        print(f"  BIDS: {bids_abs}")
        print(f"  Output: {output_abs}")
        print(f"  Command: {' '.join(mriqc_command)}")
        
        # Start container
        container = docker_client.containers.run(
            image=mriqc_image,
            command=mriqc_command,
            volumes={
                bids_abs: {'bind': '/data', 'mode': 'ro'},
                output_abs: {'bind': '/out', 'mode': 'rw'},
                work_abs: {'bind': '/work', 'mode': 'rw'}
            },
            user=f'{os.getuid()}:{os.getgid()}',
            name=container_name,
            remove=False,
            detach=True
        )
        
        print(f"✓ Container started: {container.id[:12]}")
        
        # Verify container is running
        success, error_msg, logs = wait_and_verify_container(container, running_file)
        if not success:
            return jsonify({'status': 'error', 'message': error_msg, 'logs': logs}), 500
        
        return jsonify({
            'status': 'success',
            'message': f'MRIQC processing started{" for " + classification if classification else ""}',
            'container_id': container.id[:12],
            'classification': classification
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        if os.path.exists(running_file):
            os.remove(running_file)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@mriqc_bp.route('/api/mriqc_status/<folder_name>', methods=['GET'])
def get_mriqc_status_route(folder_name):
    """Get MRIQC processing status for a folder - checks all classifications"""
    classification = request.args.get('classification')
    
    if classification:
        # Check specific classification
        mriqc_dir = os.path.join(folder_name, f'mriqc_output_{classification}')
        container_name = f'mriqc_{folder_name}_{classification}'
        
        status = get_mriqc_status(mriqc_dir, container_name)
        reports = find_html_reports(mriqc_dir, folder_name, classification)
        
        return jsonify({'status': status, 'reports': reports})
    else:
        # Check all classifications
        statuses = {}
        
        # Check main MRIQC (all files)
        main_mriqc_dir = os.path.join(folder_name, 'mriqc_output')
        if os.path.exists(main_mriqc_dir):
            container_name = f'mriqc_{folder_name}'
            status = get_mriqc_status(main_mriqc_dir, container_name)
            reports = find_html_reports(main_mriqc_dir, folder_name, None)
            statuses['all'] = {'status': status, 'reports': reports}
        
        # Check individual classifications
        for cls in ['anat', 'func', 'dwi', 'perf']:
            cls_mriqc_dir = os.path.join(folder_name, f'mriqc_output_{cls}')
            if os.path.exists(cls_mriqc_dir):
                container_name = f'mriqc_{folder_name}_{cls}'
                status = get_mriqc_status(cls_mriqc_dir, container_name)
                reports = find_html_reports(cls_mriqc_dir, folder_name, cls)
                statuses[cls] = {'status': status, 'reports': reports}
        
        return jsonify(statuses if statuses else {'all': {'status': 'not_started', 'reports': []}})


@mriqc_bp.route('/api/mriqc_report/<session_id>/<classification>/<path:filename>')
def serve_mriqc_report(session_id, classification, filename):
    """Serve MRIQC report files (HTML, SVG, etc.)"""
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        # Go up one level from routes/ to root
        if classification == 'all':
            mriqc_path = os.path.join(os.path.dirname(base_path), session_id, 'mriqc_output')
        else:
            mriqc_path = os.path.join(os.path.dirname(base_path), session_id, f'mriqc_output_{classification}')
        return send_from_directory(mriqc_path, filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404


@mriqc_bp.route('/api/mriqc_report/<folder_name>/<filename>')
def get_mriqc_report(folder_name, filename):
    """Serve MRIQC HTML report (backward compatible)"""
    report_path = os.path.join(folder_name, 'mriqc_output', filename)
    
    if not os.path.exists(report_path):
        return jsonify({'status': 'error', 'message': 'Report not found'}), 404
    
    return send_file(report_path)


@mriqc_bp.route('/api/mriqc_logs/<folder_name>', methods=['GET'])
def get_mriqc_logs_route(folder_name):
    """Get logs from MRIQC container for debugging"""
    classification = request.args.get('classification')
    container_name = f'mriqc_{folder_name}_{classification}' if classification else f'mriqc_{folder_name}'
    
    success, message, container_status = get_container_logs(container_name)
    
    if success:
        return jsonify({
            'status': 'success',
            'container_status': container_status,
            'logs': message
        })
    else:
        status_code = 404 if message == 'Container not found' else 500
        return jsonify({'status': 'error', 'message': message}), status_code