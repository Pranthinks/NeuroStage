from flask import Blueprint, request, jsonify, send_from_directory
import os
from utils.preproc_utils import (
    FS_LICENSE,
    get_pipeline_status,
    get_container_logs,
    find_html_reports,
    find_output_files,
    run_container
)

freesurfer_bp = Blueprint('freesurfer', __name__)

PIPELINE_ID    = 'freesurfer'
DOCKER_IMAGE   = 'freesurfer/freesurfer:7.4.1'
CLASSIFICATION = 'anat'


def get_t1_files(bids_abs, subject_id):
    """
    Find all T1w NIfTI files for the subject.
    Returns list of filenames.
    """
    anat_dir = os.path.join(bids_abs, f'sub-{subject_id}', 'anat')
    if not os.path.exists(anat_dir):
        return []
    return [
        f for f in os.listdir(anat_dir)
        if 'T1w' in f and f.endswith(('.nii', '.nii.gz'))
    ]


def build_freesurfer(bids_abs, output_abs, license_abs, subject_id, t1_file):
    """
    Build FreeSurfer recon-all command.
    Runs full cortical surface reconstruction on the T1w image.
    """
    command = [
        'recon-all',
        '-s', f'sub-{subject_id}',
        '-i', f'/data/sub-{subject_id}/anat/{t1_file}',
        '-all',
        '-sd', '/out'
    ]
    volumes = {
        bids_abs:    {'bind': '/data', 'mode': 'ro'},
        output_abs:  {'bind': '/out',  'mode': 'rw'},
        license_abs: {'bind': '/usr/local/freesurfer/license.txt', 'mode': 'ro'},
    }
    return DOCKER_IMAGE, command, volumes


# ── Routes ────────────────────────────────────────────────────────────

@freesurfer_bp.route('/api/run_freesurfer', methods=['POST'])
def run_freesurfer():
    data        = request.get_json()
    folder_name = data.get('folder_name')
    subject_id  = data.get('subject_id', '01')

    if not folder_name:
        return jsonify({'status': 'error', 'message': 'folder_name required'}), 400

    bids_dir = os.path.join(folder_name, 'bids_output')
    if not os.path.exists(bids_dir):
        return jsonify({'status': 'error', 'message': 'BIDS directory not found'}), 404

    if not os.path.exists(FS_LICENSE):
        return jsonify({'status': 'error', 'message': f'license.txt not found at {FS_LICENSE}'}), 400

    # Find T1w files
    bids_abs = os.path.abspath(bids_dir)
    t1_files = get_t1_files(bids_abs, subject_id)

    if not t1_files:
        return jsonify({'status': 'error', 'message': f'No T1w files found for sub-{subject_id}'}), 404

    # Use the first T1w file found
    t1_file = t1_files[0]
    print(f"FreeSurfer will use: {t1_file}")
    if len(t1_files) > 1:
        print(f"Multiple T1w files found, using first: {t1_files}")

    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'

    os.makedirs(output_dir, exist_ok=True)

    image, command, volumes = build_freesurfer(
        bids_abs,
        os.path.abspath(output_dir),
        os.path.abspath(FS_LICENSE),
        subject_id,
        t1_file
    )

    success, message, container_id = run_container(image, command, volumes, container_name, output_dir)

    if not success:
        return jsonify({'status': 'error', 'message': message}), 500

    return jsonify({
        'status': 'success',
        'message': f'FreeSurfer started on {t1_file}',
        'container_id': container_id,
        't1_file': t1_file
    })


@freesurfer_bp.route('/api/freesurfer_status/<folder_name>', methods=['GET'])
def freesurfer_status(folder_name):
    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'
    status         = get_pipeline_status(output_dir, container_name)

    # FreeSurfer doesn't produce HTML reports — check for recon-all completion file instead
    completed = False
    subject_dir = os.path.join(output_dir, f'sub-01')
    if os.path.exists(os.path.join(subject_dir, 'surf', 'lh.pial')):
        completed = True

    if completed and status == 'not_started':
        status = 'completed'

    return jsonify({'status': status, 'reports': []})


@freesurfer_bp.route('/api/freesurfer_results/<folder_name>', methods=['GET'])
def freesurfer_results(folder_name):
    output_dir  = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    subject_dir = os.path.join(output_dir, 'sub-01')

    # FreeSurfer outputs key files — list the most useful ones
    key_outputs = []
    if os.path.exists(subject_dir):
        for subdir in ['surf', 'mri', 'stats', 'label']:
            subdir_path = os.path.join(subject_dir, subdir)
            if os.path.exists(subdir_path):
                files = os.listdir(subdir_path)
                key_outputs.append({
                    'folder': subdir,
                    'file_count': len(files),
                    'files': files[:10]  # show first 10 only
                })

    return jsonify({
        'status':   'success',
        'reports':  [],
        'files':    find_output_files(output_dir),
        'outputs':  key_outputs
    })


@freesurfer_bp.route('/api/freesurfer_report/<folder_name>/<path:filename>')
def freesurfer_report(folder_name, filename):
    output_dir = os.path.abspath(os.path.join(folder_name, f'preproc_{PIPELINE_ID}'))
    return send_from_directory(output_dir, filename)


@freesurfer_bp.route('/api/freesurfer_logs/<folder_name>', methods=['GET'])
def freesurfer_logs(folder_name):
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'
    logs, container_status = get_container_logs(container_name)
    return jsonify({'status': 'success', 'logs': logs, 'container_status': container_status})