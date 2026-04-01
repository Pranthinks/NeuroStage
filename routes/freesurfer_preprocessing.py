from flask import Blueprint, request, jsonify, send_from_directory
import os
import docker
import time
from utils.preproc_utils import (
    FS_LICENSE,
    get_pipeline_status,
    get_container_logs,
    find_html_reports,
    find_output_files
)

freesurfer_bp = Blueprint('freesurfer', __name__)

PIPELINE_ID    = 'freesurfer'
DOCKER_IMAGE   = 'freesurfer/freesurfer:7.4.1'
CLASSIFICATION = 'anat'


def get_t1_files(bids_abs, subject_id):
    """Find all T1w NIfTI files for the subject."""
    anat_dir = os.path.join(bids_abs, f'sub-{subject_id}', 'anat')
    if not os.path.exists(anat_dir):
        return []
    return [
        f for f in os.listdir(anat_dir)
        if 'T1w' in f and f.endswith(('.nii', '.nii.gz'))
    ]


def run_freesurfer_container(bids_abs, output_abs, license_abs, subject_id, t1_file, container_name, output_dir):
    """
    Run FreeSurfer container WITHOUT the user flag.
    FreeSurfer requires root inside the container — passing user= causes
    'Permission denied' errors on /root.
    Output files will be owned by root; use sudo to delete them if needed.
    """
    running_file = os.path.join(output_dir, '.pipeline_running')

    try:
        client = docker.from_env()

        # Pull image if not present
        try:
            client.images.get(DOCKER_IMAGE)
        except docker.errors.ImageNotFound:
            print(f"Pulling {DOCKER_IMAGE} ...")
            client.images.pull(DOCKER_IMAGE)

        # Remove old container if exists
        try:
            client.containers.get(container_name).remove(force=True)
        except Exception:
            pass

        os.makedirs(output_dir, exist_ok=True)
        with open(running_file, 'w') as f:
            f.write('running')

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

        print(f"Starting FreeSurfer container: {container_name}")
        print(f"  T1w: {t1_file}")
        print(f"  Output: {output_abs}")

        # NOTE: No user= flag here — FreeSurfer must run as root
        container = client.containers.run(
            image=DOCKER_IMAGE,
            command=command,
            volumes=volumes,
            name=container_name,
            remove=False,
            detach=True
        )

        # Wait 2s and confirm it didn't crash immediately
        time.sleep(2)
        container.reload()

        if container.status not in ('running', 'created'):
            logs = container.logs().decode('utf-8', errors='replace')
            if os.path.exists(running_file):
                os.remove(running_file)
            return False, logs, None

        return True, 'started', container.id[:12]

    except Exception as e:
        if os.path.exists(running_file):
            os.remove(running_file)
        print(f"ERROR starting FreeSurfer: {e}")
        return False, str(e), None


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

    bids_abs = os.path.abspath(bids_dir)
    t1_files = get_t1_files(bids_abs, subject_id)

    if not t1_files:
        return jsonify({'status': 'error', 'message': f'No T1w files found for sub-{subject_id}'}), 404

    t1_file = t1_files[0]
    print(f"FreeSurfer will use: {t1_file}")
    if len(t1_files) > 1:
        print(f"Multiple T1w files found, using first: {t1_files}")

    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'

    success, message, container_id = run_freesurfer_container(
        bids_abs,
        os.path.abspath(output_dir),
        os.path.abspath(FS_LICENSE),
        subject_id,
        t1_file,
        container_name,
        output_dir
    )

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

    # FreeSurfer completion check — lh.pial is one of the last files written
    subject_dir = os.path.join(output_dir, f'sub-{folder_name.split("_")[-1] if "_" in folder_name else "01"}')
    pial_file   = os.path.join(output_dir, 'sub-01', 'surf', 'lh.pial')
    if os.path.exists(pial_file) and status == 'not_started':
        status = 'completed'

    return jsonify({'status': status, 'reports': []})


@freesurfer_bp.route('/api/freesurfer_results/<folder_name>', methods=['GET'])
def freesurfer_results(folder_name):
    output_dir  = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    subject_dir = os.path.join(output_dir, 'sub-01')

    key_outputs = []
    if os.path.exists(subject_dir):
        for subdir in ['surf', 'mri', 'stats', 'label']:
            subdir_path = os.path.join(subject_dir, subdir)
            if os.path.exists(subdir_path):
                files = os.listdir(subdir_path)
                key_outputs.append({
                    'folder': subdir,
                    'file_count': len(files),
                    'files': files[:10]
                })

    return jsonify({
        'status':  'success',
        'reports': [],
        'files':   find_output_files(output_dir),
        'outputs': key_outputs
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