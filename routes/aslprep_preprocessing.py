from flask import Blueprint, request, jsonify, send_from_directory
import os
import nibabel as nib
import json
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


def get_valid_asl_runs(perf_dir):
    """
    Returns list of run numbers that have valid multi-volume ASL data.
    Single-volume files are M0 scans — skip them.
    """
    valid_runs = []
    m0_runs    = []

    nii_files = sorted([
        f for f in os.listdir(perf_dir)
        if f.endswith(('.nii', '.nii.gz')) and 'asl' in f.lower()
    ])

    for nii_file in nii_files:
        nii_path = os.path.join(perf_dir, nii_file)
        shape    = nib.load(nii_path).shape
        n_vols   = shape[3] if len(shape) == 4 else 1

        # Extract run number if present
        run_tag = next((p for p in nii_file.replace('.nii.gz','').replace('.nii','').split('_')
                        if p.startswith('run-')), None)

        if n_vols > 1:
            valid_runs.append((nii_file, run_tag, n_vols))
        else:
            m0_runs.append((nii_file, run_tag))

    print(f"Valid ASL runs: {[r[0] for r in valid_runs]}")
    print(f"M0 scans (skipped): {[r[0] for r in m0_runs]}")

    return valid_runs, m0_runs


def prepare_asl_bids(perf_dir, valid_runs, m0_runs):
    """
    Create aslcontext.tsv and patch JSON only for valid ASL runs.
    """
    # Build set of M0 run tags for lookup
    m0_run_tags = {r[1] for r in m0_runs}
    has_separate_m0 = len(m0_runs) > 0

    created_context = []
    patched_json    = []

    for nii_file, run_tag, n_vols in valid_runs:
        base         = nii_file.replace('.nii.gz', '').replace('.nii', '')
        json_path    = os.path.join(perf_dir, base + '.json')
        context_path = os.path.join(perf_dir, base + 'context.tsv')

        # Load JSON
        meta = {}
        if os.path.exists(json_path):
            with open(json_path) as f:
                meta = json.load(f)

        asl_type = meta.get('ArterialSpinLabelingType', 'PCASL').upper()

        # ── 1. aslcontext.tsv ─────────────────────────────────────────
        if not os.path.exists(context_path):
            lines = ['volume_type']
            for _ in range(n_vols // 2):
                lines.append('control')
                lines.append('label')
            if n_vols % 2 != 0:
                lines.append('m0scan')

            with open(context_path, 'w') as f:
                f.write('\n'.join(lines))

            created_context.append(nii_file)
            print(f"Created aslcontext for {nii_file} ({n_vols} vols)")

        # ── 2. Patch JSON ─────────────────────────────────────────────
        if os.path.exists(json_path):
            changed = False

            if 'M0Type' not in meta:
                meta['M0Type'] = 'Separate' if has_separate_m0 else 'Included'
                changed = True
                print(f"Patched M0Type={meta['M0Type']} for {nii_file}")

            if asl_type == 'PASL':
                if 'BolusCutOffFlag' not in meta:
                    meta['BolusCutOffFlag'] = True
                    changed = True
                if meta.get('BolusCutOffFlag') and 'BolusCutOffTechnique' not in meta:
                    meta['BolusCutOffTechnique'] = 'QUIPSSII'
                    changed = True
                if meta.get('BolusCutOffFlag') and 'BolusCutOffDelayTime' not in meta:
                    meta['BolusCutOffDelayTime'] = 0.7
                    changed = True

            if changed:
                with open(json_path, 'w') as f:
                    json.dump(meta, f, indent=2)
                patched_json.append(nii_file)

    # Also create aslcontext.tsv for M0 scans so ASLPrep can find them
    for nii_file, run_tag in m0_runs:
        base         = nii_file.replace('.nii.gz', '').replace('.nii', '')
        context_path = os.path.join(perf_dir, base + 'context.tsv')
        if not os.path.exists(context_path):
            with open(context_path, 'w') as f:
                f.write('volume_type\nm0scan')
            print(f"Created m0scan aslcontext for {nii_file}")

    return created_context, patched_json


def create_bids_filter(folder_name, valid_runs):
    """
    Write a BIDS filter JSON that tells ASLPrep to only process valid ASL runs.
    Returns path to the filter file.
    """
    # Build run list from valid runs
    run_numbers = []
    for _, run_tag, _ in valid_runs:
        if run_tag:
            run_num = run_tag.replace('run-', '')
            run_numbers.append(run_num)

    filter_file = os.path.join(folder_name, 'aslprep_bids_filter.json')

    if run_numbers:
        bids_filter = {
            "asl": {
                "datatype": "perf",
                "run": run_numbers
            }
        }
    else:
        # No run tags — just filter by datatype
        bids_filter = {
            "asl": {
                "datatype": "perf"
            }
        }

    with open(filter_file, 'w') as f:
        json.dump(bids_filter, f, indent=2)

    print(f"Created BIDS filter: {bids_filter}")
    return filter_file


def build_aslprep(bids_abs, output_abs, work_abs, license_abs, subject_id, filter_file_abs):
    command = [
        '/data', '/out', 'participant',
        '--participant-label', subject_id,
        '--skip_bids_validation',
        '--fs-license-file', '/opt/freesurfer/license.txt',
        '--bids-filter-file', '/filter/bids_filter.json',
        '-w', '/work'
    ]
    volumes = {
        bids_abs:       {'bind': '/data',                       'mode': 'ro'},
        output_abs:     {'bind': '/out',                        'mode': 'rw'},
        work_abs:       {'bind': '/work',                       'mode': 'rw'},
        license_abs:    {'bind': '/opt/freesurfer/license.txt', 'mode': 'ro'},
        filter_file_abs:{'bind': '/filter/bids_filter.json',    'mode': 'ro'},
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

    perf_dir = os.path.join(bids_dir, f'sub-{subject_id}', 'perf')
    if not os.path.exists(perf_dir) or not any(
        f.endswith(('.nii', '.nii.gz')) for f in os.listdir(perf_dir)
    ):
        return jsonify({'status': 'error', 'message': 'No perfusion files found for this subject'}), 404

    # Find valid ASL runs (skip single-volume M0 scans)
    valid_runs, m0_runs = get_valid_asl_runs(perf_dir)

    if not valid_runs:
        return jsonify({'status': 'error', 'message': 'No valid multi-volume ASL runs found'}), 404

    # Prepare BIDS files
    try:
        created_context, patched_json = prepare_asl_bids(perf_dir, valid_runs, m0_runs)
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Failed to prepare ASL BIDS files: {str(e)}'}), 500

    # Create BIDS filter to only process valid runs
    filter_file = create_bids_filter(folder_name, valid_runs)

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
        subject_id,
        os.path.abspath(filter_file)
    )

    success, message, container_id = run_container(image, command, volumes, container_name, output_dir)

    if not success:
        return jsonify({'status': 'error', 'message': message}), 500

    return jsonify({
        'status': 'success',
        'message': f'ASLPrep started on {len(valid_runs)} valid run(s), skipped {len(m0_runs)} M0 scan(s)',
        'container_id': container_id,
        'valid_runs': [r[0] for r in valid_runs],
        'skipped_m0': [r[0] for r in m0_runs],
        'aslcontext_created': created_context,
        'json_patched': patched_json
    })


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