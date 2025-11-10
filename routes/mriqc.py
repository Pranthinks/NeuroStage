from flask import Blueprint, request, jsonify, send_file, send_from_directory
import os
import docker
import json

mriqc_bp = Blueprint('mriqc', __name__)

def ensure_bids_valid(bids_dir):
    """Ensure BIDS directory has required dataset_description.json"""
    desc_file = os.path.join(bids_dir, "dataset_description.json")
    
    if not os.path.exists(desc_file):
        description = {
            "Name": "Medical Imaging Dataset",
            "BIDSVersion": "1.6.0",
            "DatasetType": "raw",
            "GeneratedBy": [
                {
                    "Name": "dcm2bids",
                    "Description": "DICOM to BIDS converter"
                }
            ]
        }
        
        with open(desc_file, 'w') as f:
            json.dump(description, f, indent=2)
    
    return True

@mriqc_bp.route('/api/run_mriqc', methods=['POST'])
def run_mriqc():
    """Run MRIQC quality control on BIDS data"""
    data = request.get_json()
    folder_name = data.get('folder_name')
    subject_id = data.get('subject_id', '01')
    
    print(f"MRIQC REQUEST: folder={folder_name}, subject={subject_id}")
    
    if not folder_name:
        return jsonify({'status': 'error', 'message': 'Folder name required'}), 400
    
    bids_dir = os.path.join(folder_name, 'bids_output')
    mriqc_dir = os.path.join(folder_name, 'mriqc_output')
    work_dir = os.path.join(folder_name, 'mriqc_work')
    
    if not os.path.exists(bids_dir):
        return jsonify({'status': 'error', 'message': 'BIDS directory not found'}), 404
    
    # Check dataset_description.json
    desc_file = os.path.join(bids_dir, 'dataset_description.json')
    if not os.path.exists(desc_file):
        print("Creating dataset_description.json")
        ensure_bids_valid(bids_dir)
    
    try:
        os.makedirs(mriqc_dir, exist_ok=True)
        os.makedirs(work_dir, exist_ok=True)
        
        running_file = os.path.join(mriqc_dir, '.mriqc_running')
        with open(running_file, 'w') as f:
            f.write('running')
        
        # Remove old container if exists
        try:
            docker_client = docker.from_env()
            old = docker_client.containers.get(f'mriqc_{folder_name}')
            old.remove(force=True)
            print(f"Removed old container")
        except:
            pass
        
        docker_client = docker.from_env()
        mriqc_image = "nipreps/mriqc:latest"
        
        try:
            docker_client.images.get(mriqc_image)
        except docker.errors.ImageNotFound:
            docker_client.images.pull(mriqc_image)
        
        bids_abs = os.path.abspath(bids_dir)
        output_abs = os.path.abspath(mriqc_dir)
        work_abs = os.path.abspath(work_dir)
        
        print(f"Starting MRIQC container...")
        print(f"  BIDS: {bids_abs}")
        print(f"  Output: {output_abs}")
        
        container = docker_client.containers.run(
            image=mriqc_image,
            command=[
                "/data", "/out", "participant",
                "--participant-label", subject_id,
                "-w", "/work",
                "--no-sub"
            ],
            volumes={
                bids_abs: {'bind': '/data', 'mode': 'ro'},
                output_abs: {'bind': '/out', 'mode': 'rw'},
                work_abs: {'bind': '/work', 'mode': 'rw'}
            },
            user=f'{os.getuid()}:{os.getgid()}',
            name=f'mriqc_{folder_name}',
            remove=False,
            detach=True
        )
        
        print(f"✓ Container started: {container.id[:12]}")
        
        return jsonify({
            'status': 'success',
            'message': 'MRIQC processing started',
            'container_id': container.id[:12]
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        if os.path.exists(running_file):
            os.remove(running_file)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mriqc_bp.route('/api/mriqc_status/<folder_name>', methods=['GET'])
def get_mriqc_status(folder_name):
    """Get MRIQC processing status for a folder"""
    mriqc_dir = os.path.join(folder_name, 'mriqc_output')
    
    if not os.path.exists(mriqc_dir):
        return jsonify({'status': 'not_started', 'reports': []})
    
    # Check if container is running
    try:
        docker_client = docker.from_env()
        try:
            container = docker_client.containers.get(f'mriqc_{folder_name}')
            if container.status == 'running':
                return jsonify({'status': 'running', 'reports': []})
            else:
                # Container stopped, remove running file
                running_file = os.path.join(mriqc_dir, '.mriqc_running')
                if os.path.exists(running_file):
                    os.remove(running_file)
        except:
            pass
    except:
        pass
    
    # Check for running indicator
    running_file = os.path.join(mriqc_dir, '.mriqc_running')
    if os.path.exists(running_file):
        return jsonify({'status': 'running', 'reports': []})
    
    # Check for HTML reports
    html_files = [f for f in os.listdir(mriqc_dir) if f.endswith('.html')]
    
    if html_files:
        reports = []
        for report in html_files:
            reports.append({
                'filename': report,
                'name': report.replace('.html', '').replace('_', ' ').title(),
                'path': f'/api/mriqc_report/{folder_name}/{report}'
            })
        return jsonify({'status': 'completed', 'reports': reports})
    
    return jsonify({'status': 'not_started', 'reports': []})

@mriqc_bp.route('/api/mriqc_report/<session_id>/<path:filename>')
def serve_mriqc_report(session_id, filename):
    """Serve MRIQC report files (HTML, SVG, etc.)"""
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        # Go up one level from routes/ to root
        mriqc_path = os.path.join(os.path.dirname(base_path), session_id, 'mriqc_output')
        return send_from_directory(mriqc_path, filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

@mriqc_bp.route('/api/mriqc_report/<folder_name>/<filename>')
def get_mriqc_report(folder_name, filename):
    """Serve MRIQC HTML report"""
    report_path = os.path.join(folder_name, 'mriqc_output', filename)
    
    if not os.path.exists(report_path):
        return jsonify({'status': 'error', 'message': 'Report not found'}), 404
    
    return send_file(report_path)