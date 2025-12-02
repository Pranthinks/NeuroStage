"""
MRIQC utility functions
Handles BIDS validation, container management, and status checking
"""
import os
import json
import docker
import time


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


def validate_classification_files(bids_dir, subject_id, classification):
    """
    Validate that files exist for the given classification
    Returns: (success: bool, error_message: str, file_count: int)
    """
    classification_path = os.path.join(bids_dir, f'sub-{subject_id}', classification)
    
    if not os.path.exists(classification_path):
        return False, f'No {classification} files found for subject {subject_id}', 0
    
    # Count NIfTI files
    files_count = len([f for f in os.listdir(classification_path) 
                      if f.endswith('.nii') or f.endswith('.nii.gz')])
    
    if files_count == 0:
        return False, f'No NIfTI files found in {classification} directory', 0
    
    return True, None, files_count


def get_modality_command(classification):
    """
    Get MRIQC modality flags for a given classification
    Returns: (modalities: list, error: str)
    """
    modality_map = {
        'anat': ['T1w', 'T2w'],  
        'func': ['bold'],        
        'dwi': ['dwi']
        # Note: perf/ASL is not supported by MRIQC
    }
    
    if classification and classification != 'all':
        if classification in modality_map:
            return modality_map[classification], None
        else:
            return None, f'MRIQC does not support quality control for {classification} scans'
    
    return None, None  # No modality filter (all files)


def remove_old_container(container_name):
    """Remove old MRIQC container if it exists"""
    try:
        docker_client = docker.from_env()
        old = docker_client.containers.get(container_name)
        old.remove(force=True)
        print(f"Removed old container: {container_name}")
        return True
    except:
        return False


def check_container_status(container_name):
    """
    Check if a Docker container is running
    Returns: (is_running: bool, status: str)
    """
    try:
        docker_client = docker.from_env()
        container = docker_client.containers.get(container_name)
        return container.status == 'running', container.status
    except docker.errors.NotFound:
        return False, 'not_found'
    except Exception:
        return False, 'error'


def wait_and_verify_container(container, running_file):
    """
    Wait for container to start and verify it's running
    Returns: (success: bool, error_message: str, logs: str)
    """
    time.sleep(2)
    container.reload()
    
    if container.status != 'running':
        logs = container.logs().decode('utf-8')
        print(f"ERROR: Container stopped immediately!")
        print(f"Container logs:\n{logs}")
        
        # Clean up running file
        if os.path.exists(running_file):
            os.remove(running_file)
        
        return False, 'MRIQC container failed to start. Check server logs for details.', logs
    
    return True, None, None


def get_container_logs(container_name):
    """Get logs from a Docker container"""
    try:
        docker_client = docker.from_env()
        container = docker_client.containers.get(container_name)
        logs = container.logs().decode('utf-8', errors='replace')
        return True, logs, container.status
    except docker.errors.NotFound:
        return False, 'Container not found', None
    except Exception as e:
        return False, str(e), None


def find_html_reports(mriqc_dir, folder_name, classification):
    """
    Find HTML reports in MRIQC output directory
    Returns: list of report dictionaries
    """
    if not os.path.exists(mriqc_dir):
        return []
    
    html_files = [f for f in os.listdir(mriqc_dir) if f.endswith('.html')]
    
    reports = []
    for report in html_files:
        reports.append({
            'filename': report,
            'name': report.replace('.html', '').replace('_', ' ').title(),
            'path': f'/api/mriqc_report/{folder_name}/{classification if classification else "all"}/{report}'
        })
    
    return reports


def get_mriqc_status(mriqc_dir, container_name):
    """
    Get status of MRIQC processing
    Returns: 'not_started', 'running', or 'completed'
    """
    if not os.path.exists(mriqc_dir):
        return 'not_started'
    
    # Check if container is running
    is_running, _ = check_container_status(container_name)
    if is_running:
        return 'running'
    
    # Check for running indicator file
    running_file = os.path.join(mriqc_dir, '.mriqc_running')
    if os.path.exists(running_file):
        # Container stopped, clean up running file
        try:
            os.remove(running_file)
        except:
            pass
    
    # Check for HTML reports
    html_files = [f for f in os.listdir(mriqc_dir) if f.endswith('.html')]
    if html_files:
        return 'completed'
    
    return 'not_started'