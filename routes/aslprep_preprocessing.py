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

aslprep_bp = Blueprint('aslprep', __name__)

PIPELINE_ID    = 'aslprep'
DOCKER_IMAGE   = 'pennlinc/aslprep:latest'
CLASSIFICATION = 'perf'


def build_aslprep(bids_abs, output_abs, work_abs, license_abs, subject_id):
    command = [
        '/data', '/out', 'participant',
        '--participant-label', subject_id,
        '--skip_bids_validation',
        '--fs-license-file', '/opt/freesurfer/license.txt',
        '-w', '/work'
    ]
    volumes = {
        bids_abs:    {'bind': '/data',                       'mode': 'ro'},
        output_abs:  {'bind': '/out',                        'mode': 'rw'},
        work_abs:    {'bind': '/work',                       'mode': 'rw'},
        license_abs: {'bind': '/opt/freesurfer/license.txt', 'mode': 'ro'},
    }
    return DOCKER_IMAGE, command, volumes


# ── Routes ────────────────────────────────────────────────────────────

@aslprep_bp.route('/api/run_aslprep', methods=['POST'])
def run_aslprep():
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

    # Check perf files exist
    perf_dir = os.path.join(bids_dir, f'sub-{subject_id}', 'perf')
    if not os.path.exists(perf_dir) or not any(
        f.endswith(('.nii', '.nii.gz')) for f in os.listdir(perf_dir)
    ):
        return jsonify({'status': 'error', 'message': 'No perfusion files found for this subject'}), 404

    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    work_dir       = os.path.join(folder_name, f'preproc_{PIPELINE_ID}_work')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(work_dir,   exist_ok=True)

    image, command, volumes = build_aslprep(
        os.path.abspath(bids_dir),
        os.path.abspath(output_dir),
        os.path.abspath(work_dir),
        os.path.abspath(FS_LICENSE),
        subject_id
    )

    success, message, container_id = run_container(image, command, volumes, container_name, output_dir)

    if not success:
        return jsonify({'status': 'error', 'message': message}), 500

    return jsonify({'status': 'success', 'message': 'ASLPrep started', 'container_id': container_id})


@aslprep_bp.route('/api/aslprep_status/<folder_name>', methods=['GET'])
def aslprep_status(folder_name):
    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'
    status         = get_pipeline_status(output_dir, container_name)
    reports        = find_html_reports(output_dir) if status == 'completed' else []
    return jsonify({'status': status, 'reports': reports})


@aslprep_bp.route('/api/aslprep_results/<folder_name>', methods=['GET'])
def aslprep_results(folder_name):
    output_dir = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    return jsonify({
        'status':  'success',
        'reports': find_html_reports(output_dir),
        'files':   find_output_files(output_dir)
    })


@aslprep_bp.route('/api/aslprep_report/<folder_name>/<path:filename>')
def aslprep_report(folder_name, filename):
    output_dir = os.path.abspath(os.path.join(folder_name, f'preproc_{PIPELINE_ID}'))
    return send_from_directory(output_dir, filename)


@aslprep_bp.route('/api/aslprep_logs/<folder_name>', methods=['GET'])
def aslprep_logs(folder_name):
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'
    logs, container_status = get_container_logs(container_name)
    return jsonify({'status': 'success', 'logs': logs, 'container_status': container_status})