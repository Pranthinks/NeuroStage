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

hcp_bp = Blueprint('hcp', __name__)

PIPELINE_ID    = 'hcp'
DOCKER_IMAGE   = 'humanconnectome/hcp-pipelines:v4.7.0'
CLASSIFICATION = 'anat'


def get_anat_files(bids_abs, subject_id):
    """
    Find T1w and T2w NIfTI files for the subject.
    Returns (t1_files, t2_files) as lists of filenames.
    """
    anat_dir = os.path.join(bids_abs, f'sub-{subject_id}', 'anat')
    if not os.path.exists(anat_dir):
        return [], []

    all_files = os.listdir(anat_dir)

    t1_files = [
        f for f in all_files
        if 'T1w' in f and f.endswith(('.nii', '.nii.gz'))
    ]
    t2_files = [
        f for f in all_files
        if 'T2w' in f and f.endswith(('.nii', '.nii.gz'))
    ]

    return t1_files, t2_files


def build_hcp(bids_abs, output_abs, work_abs, license_abs, subject_id, t1_file, t2_file):
    """
    Build HCP PreFreeSurfer pipeline command.
    Processes T1w and T2w for surface-based analysis (CIFTI outputs).
    Pipeline stages: PreFreeSurfer → FreeSurfer → PostFreeSurfer
    """
    command = [
        '/opt/HCP-Pipelines/PreFreeSurfer/PreFreeSurferPipeline.sh',
        f'--path=/out',
        f'--subject=sub-{subject_id}',
        f'--t1=/data/sub-{subject_id}/anat/{t1_file}',
        f'--t2=/data/sub-{subject_id}/anat/{t2_file}',
        '--t1template=/opt/HCP-Pipelines/global/templates/MNI152_T1_0.7mm.nii.gz',
        '--t1templatebrain=/opt/HCP-Pipelines/global/templates/MNI152_T1_0.7mm_brain.nii.gz',
        '--t1template2mm=/opt/HCP-Pipelines/global/templates/MNI152_T1_2mm.nii.gz',
        '--t2template=/opt/HCP-Pipelines/global/templates/MNI152_T2_0.7mm.nii.gz',
        '--t2templatebrain=/opt/HCP-Pipelines/global/templates/MNI152_T2_0.7mm_brain.nii.gz',
        '--t2template2mm=/opt/HCP-Pipelines/global/templates/MNI152_T2_2mm.nii.gz',
        '--templatemask=/opt/HCP-Pipelines/global/templates/MNI152_T1_0.7mm_brain_mask.nii.gz',
        '--template2mmmask=/opt/HCP-Pipelines/global/templates/MNI152_T1_2mm_brain_mask_dil.nii.gz',
        '--brainsize=150',
        '--fnirtconfig=/opt/HCP-Pipelines/global/config/T1_2_MNI152_2mm.cnf',
        '--fmapmag=NONE',
        '--fmapphase=NONE',
        '--fmapgeneralelectric=NONE',
        '--echodiff=NONE',
        '--SEPhaseNeg=NONE',
        '--SEPhasePos=NONE',
        '--seechospacing=NONE',
        '--seunwarpdir=NONE',
        '--t1samplespacing=NONE',
        '--t2samplespacing=NONE',
        '--unwarpdir=z',
        '--gdcoeffs=NONE',
        '--avgrdcmethod=NONE',
        '--topupconfig=NONE',
        '--printcom='
    ]
    volumes = {
        bids_abs:    {'bind': '/data',  'mode': 'ro'},
        output_abs:  {'bind': '/out',   'mode': 'rw'},
        work_abs:    {'bind': '/work',  'mode': 'rw'},
        license_abs: {'bind': '/opt/freesurfer/license.txt', 'mode': 'ro'},
    }
    return DOCKER_IMAGE, command, volumes


# ── Routes ────────────────────────────────────────────────────────────

@hcp_bp.route('/api/run_hcp', methods=['POST'])
def run_hcp():
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

    # Find T1w and T2w files
    bids_abs          = os.path.abspath(bids_dir)
    t1_files, t2_files = get_anat_files(bids_abs, subject_id)

    # HCP requires BOTH T1w and T2w
    if not t1_files:
        return jsonify({'status': 'error', 'message': f'No T1w files found for sub-{subject_id}. HCP requires both T1w and T2w.'}), 404

    if not t2_files:
        return jsonify({'status': 'error', 'message': f'No T2w files found for sub-{subject_id}. HCP requires both T1w and T2w.'}), 404

    t1_file = t1_files[0]
    t2_file = t2_files[0]

    print(f"HCP Pipeline will use:")
    print(f"  T1w: {t1_file}")
    print(f"  T2w: {t2_file}")

    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    work_dir       = os.path.join(folder_name, f'preproc_{PIPELINE_ID}_work')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(work_dir,   exist_ok=True)

    image, command, volumes = build_hcp(
        bids_abs,
        os.path.abspath(output_dir),
        os.path.abspath(work_dir),
        os.path.abspath(FS_LICENSE),
        subject_id,
        t1_file,
        t2_file
    )

    success, message, container_id = run_container(image, command, volumes, container_name, output_dir)

    if not success:
        return jsonify({'status': 'error', 'message': message}), 500

    return jsonify({
        'status': 'success',
        'message': f'HCP Pipeline started on {t1_file} + {t2_file}',
        'container_id': container_id,
        't1_file': t1_file,
        't2_file': t2_file
    })


@hcp_bp.route('/api/hcp_status/<folder_name>', methods=['GET'])
def hcp_status(folder_name):
    output_dir     = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'
    status         = get_pipeline_status(output_dir, container_name)

    # HCP completion check — MNINonLinear folder is created at the end
    subject_dir = os.path.join(output_dir, 'sub-01', 'MNINonLinear')
    if os.path.exists(subject_dir) and status == 'not_started':
        status = 'completed'

    reports = find_html_reports(output_dir)
    return jsonify({'status': status, 'reports': reports})


@hcp_bp.route('/api/hcp_results/<folder_name>', methods=['GET'])
def hcp_results(folder_name):
    output_dir = os.path.join(folder_name, f'preproc_{PIPELINE_ID}')
    return jsonify({
        'status':  'success',
        'reports': find_html_reports(output_dir),
        'files':   find_output_files(output_dir)
    })


@hcp_bp.route('/api/hcp_report/<folder_name>/<path:filename>')
def hcp_report(folder_name, filename):
    output_dir = os.path.abspath(os.path.join(folder_name, f'preproc_{PIPELINE_ID}'))
    return send_from_directory(output_dir, filename)


@hcp_bp.route('/api/hcp_logs/<folder_name>', methods=['GET'])
def hcp_logs(folder_name):
    container_name = f'preproc_{PIPELINE_ID}_{folder_name}'
    logs, container_status = get_container_logs(container_name)
    return jsonify({'status': 'success', 'logs': logs, 'container_status': container_status})