from flask import Flask, request, send_file, jsonify
import os, zipfile, subprocess, uuid, shutil, json
import pydicom
import docker
from flask import send_from_directory
from pathlib import Path

app = Flask(__name__)
USERS_FILE = 'users.json'

DCM2BIDS_CONFIG = {
    "descriptions": [
        {"datatype": "anat", "suffix": "T1w", "criteria": {
    "SeriesDescription": {
      "any": [
          "*t1*", "*T1*", "*T1W*", "*t1w*",
          "*MPRAGE*", "*mprage*", "*MPRage*", "*Mprage*",
          "*BRAVO*", "*bravo*", "*Bravo*",
          "*SPGR*", "*spgr*",
          "*TFE*", "*tfe*", "*3DTFE*",
          "*T1_*", "*_T1*", "*-T1*", "*T1-*",
          "*sag*t1*", "*ax*t1*", "*cor*t1*",
          "*3D*T1*", "*T1*3D*",
          "*GR_IR*", "*FSPGR*", "*fspgr*",
          "*IR-*", "*-IR*",
          "*t1_mpr*", "*mpr_t1*",
          "*structural*", "*STRUCTURAL*"
        ]
    },
    "FlipAngle": {"lt": "20"}
  }},
        {
  "datatype": "anat",
  "suffix": "T2w",
  "criteria": {
    "SeriesDescription": {
      "any": ["T2*", "*t2*", "*T2*", "*T2W*", "*t2w*",
          "*TSE*", "*tse*", "*FSE*", "*fse*",
          "*SPACE*", "*space*", "*Space*",
          "*CUBE*", "*cube*", "*Cube*",
          "*FRFSE*", "*frfse*",
          "*T2_*", "*_T2*", "*-T2*", "*T2-*",
          "*sag*t2*", "*ax*t2*", "*cor*t2*",
          "*3D*T2*", "*T2*3D*",
          "*t2_spc*", "*spc_t2*",
          "*T2*DRIVE*", "*T2*drive*",
          "*RESTORE*", "*restore*"]
    },
    "FlipAngle": {
      "gt": "100"
    },
    "ScanningSequence": "*SE*"
  }
},
        {
  "datatype": "func",
  "suffix": "bold",
  "custom_entities": "task-rest",
  "criteria": {
    "SeriesDescription": {
      "any": ["*bold*","*_se*", "*BOLD*", "*Bold*",
"*fmri*", "*fMRI*", "*FMRI*", "*Fmri*",
"*func*", "*FUNC*", "*Func*", "*functional*", "*FUNCTIONAL*",
"*task*", "*TASK*", "*Task*",
"*bold_*", "*_bold*",
"*fmri_*", "*_fmri*"
]
    },
    "FlipAngle": {
      "btwe": ["30", "100"]
    },
    "ScanningSequence": "*EP*"
  },
  "sidecar_changes": {
    "TaskName": "rest"
  }
},
        {
  "datatype": "dwi",
  "suffix": "dwi",
  "criteria": {
    "SeriesDescription": {
      "any": [
          "*dwi*", "*DWI*", "*Dwi*",
          "*dti*", "*DTI*", "*Dti*",
          "*diff*", "*DIFF*", "*Diff*", "*diffusion*", "*DIFFUSION*",
          "*dw*", "*DW*",
          "*dwi_*", "*_dwi*", "*-dwi*", "*dwi-*",
          "*dti_*", "*_dti*", "*-dti*", "*dti-*",
          "*ep2d*diff*", "*ep_b*",
          "*tensor*", "*TENSOR*",
          "*HARDI*", "*hardi*"
        ]
    },
    "FlipAngle": {
      "btwe": ["30", "100"]
    },
    "ScanningSequence": "*EP*"
  }
},
       {
  "datatype": "perf",
  "suffix": "asl",
  "custom_entities": "task-rest",
  "criteria": {
    "SeriesDescription": {
      "any": ["*pcasl*", "*PCASL*", "*Perfusion*", "*asl*", "*ASL*", "*Asl*",
          "*arterial*spin*", "*ARTERIAL*SPIN*",
          "*pcasl*", "*PCASL*", "*pCASL*", "*pASL*",
          "*casl*", "*CASL*",
          "*asl_*", "*_asl*",
          "*perfusion*", "*PERFUSION*"]
    },
    "FlipAngle": {
      "gt": "100"
    },
    "ScanningSequence": "*EP*"
  }
}
]
}

def load_users():
    try:
        return json.load(open(USERS_FILE)) if os.path.exists(USERS_FILE) else {}
    except:
        return {}

def save_users(users):
    json.dump(users, open(USERS_FILE, 'w'), indent=2)

def is_dicom_file(filepath):
    try:
        pydicom.dcmread(filepath, stop_before_pixels=True)
        return True
    except:
        return filepath.lower().endswith(('.dcm', '.dicom', '.ima'))

def consolidate_dicom_files(source_dir, target_dir):
    os.makedirs(target_dir, exist_ok=True)
    dicom_count = 0
    for dirpath, _, filenames in os.walk(source_dir):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if is_dicom_file(filepath):
                rel_path = os.path.relpath(dirpath, source_dir)
                target_subdir = os.path.join(target_dir, rel_path)
                os.makedirs(target_subdir, exist_ok=True)
                shutil.copy2(filepath, os.path.join(target_subdir, filename))
                dicom_count += 1
    return dicom_count

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


@app.route('/api/mriqc_report/<session_id>/<path:filename>')
def serve_mriqc_report(session_id, filename):
    """Serve MRIQC report files (HTML, SVG, etc.)"""
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        mriqc_path = os.path.join(base_path, session_id, 'mriqc_output')
        return send_from_directory(mriqc_path, filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404



@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    if data['email'] in load_users():
        return jsonify({'status': 'error', 'message': 'Email already registered'}), 400
    
    users = load_users()
    users[data['email']] = {k: data[k] for k in ['name', 'email', 'password']}
    save_users(users)
    return jsonify({'status': 'success', 'message': 'User registered successfully', 
                    'user': {'name': data['name'], 'email': data['email']}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'status': 'error', 'message': 'Missing email or password'}), 400
    
    user = load_users().get(data['email'])
    if user and user['password'] == data['password']:
        return jsonify({'status': 'success', 'message': 'Login successful', 
                       'user': {'name': user['name'], 'email': user['email']}})
    return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401

@app.route('/')
def home():
    return send_file('home.html')

@app.route('/classify')
def classify_page():
    return send_file('classify.html')

@app.route('/upload', methods=['POST'])
def upload():
    temp_folder = f"temp_{str(uuid.uuid4())[:8]}"
    paths = {k: f"{temp_folder}/{v}" for k, v in {
        'extract': 'extracted', 'dicom': 'sourcedata', 'bids': 'bids_output',
        'config': 'config.json', 'unclass': 'unclassified', 'zip': 'input.zip'
    }.items()}
    
    try:
        os.makedirs(paths['extract'], exist_ok=True)
        os.makedirs(paths['unclass'], exist_ok=True)
        
        request.files['file'].save(paths['zip'])
        zipfile.ZipFile(paths['zip']).extractall(paths['extract'])
        
        dicom_count = consolidate_dicom_files(paths['extract'], paths['dicom'])
        if dicom_count == 0:
            return jsonify({"status": "error", "message": "No DICOM files found in ZIP"}), 400
        
        json.dump(DCM2BIDS_CONFIG, open(paths['config'], 'w'), indent=2)
        subprocess.run(["dcm2bids", "-d", paths['dicom'], "-p", "sub-01", 
                       "-c", paths['config'], "-o", paths['bids']], check=True)
        
        # Ensure BIDS is valid
        ensure_bids_valid(paths['bids'])
        
        tmp_path = os.path.join(paths['bids'], "tmp_dcm2bids", "sub-01")
        if os.path.exists(tmp_path):
            for item in os.listdir(tmp_path):
                src = os.path.join(tmp_path, item)
                dst = os.path.join(paths['unclass'], item)
                (shutil.move if os.path.isfile(src) else 
                 lambda s, d: shutil.copytree(s, d))(src, dst)
            shutil.rmtree(os.path.join(paths['bids'], "tmp_dcm2bids"), ignore_errors=True)
        
        shutil.rmtree(paths['extract'], ignore_errors=True)
        
        return jsonify({"status": "success", 
                       "message": f"Conversion completed! Found {dicom_count} DICOM files.",
                       "folder_path": temp_folder, "dicom_count": dicom_count})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_folders', methods=['GET'])
def get_folders():
    try:
        folders = []
        for item in os.listdir('.'):
            if item.startswith('temp_') and os.path.isdir(item):
                bids_path = os.path.join(item, 'bids_output')
                mriqc_path = os.path.join(item, 'mriqc_output')
                
                if os.path.exists(bids_path):
                    # Check MRIQC status
                    mriqc_status = 'not_started'
                    mriqc_reports = []
                    
                    if os.path.exists(mriqc_path):
                        html_files = [f for f in os.listdir(mriqc_path) if f.endswith('.html')]
                        if html_files:
                            mriqc_status = 'completed'
                            mriqc_reports = html_files
                        else:
                            # Check for running indicator
                            running_file = os.path.join(mriqc_path, '.mriqc_running')
                            if os.path.exists(running_file):
                                mriqc_status = 'running'
                    
                    folders.append({
                        'name': item,
                        'file_count': sum(len(files) for _, _, files in os.walk(bids_path)),
                        'created': os.path.getctime(item),
                        'has_classification': True,
                        'mriqc_status': mriqc_status,
                        'mriqc_reports': mriqc_reports
                    })
        return jsonify({"status": "success", "folders": sorted(folders, key=lambda x: x['created'], reverse=True)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/run_mriqc', methods=['POST'])
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

@app.route('/api/mriqc_status/<folder_name>', methods=['GET'])
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

@app.route('/api/mriqc_report/<folder_name>/<filename>')
def get_mriqc_report(folder_name, filename):
    """Serve MRIQC HTML report"""
    report_path = os.path.join(folder_name, 'mriqc_output', filename)
    
    if not os.path.exists(report_path):
        return jsonify({'status': 'error', 'message': 'Report not found'}), 404
    
    return send_file(report_path)

def get_files_in_dir(dir_path):
    files = []
    if os.path.exists(dir_path):
        for file in os.listdir(dir_path):
            if file.endswith(('.nii', '.nii.gz')):
                file_path = os.path.join(dir_path, file)
                json_file = file.replace('.nii.gz', '.json').replace('.nii', '.json')
                files.append({
                    'base_name': file.split('.')[0],
                    'main_file': file,
                    'json_file': json_file if os.path.exists(os.path.join(dir_path, json_file)) else None,
                    'file_size': os.path.getsize(file_path),
                    'modified': os.path.getmtime(file_path)
                })
    return files

@app.route('/get_classified_files/<folder_name>', methods=['GET'])
def get_classified_files(folder_name):
    try:
        bids_path = os.path.join(folder_name, 'bids_output', 'sub-01')
        classified_data = {dt: get_files_in_dir(os.path.join(bids_path, dt)) 
                          for dt in ['anat', 'func', 'dwi', 'perf']}
        classified_data['unclassified'] = get_files_in_dir(os.path.join(folder_name, 'unclassified'))
        
        return jsonify({"status": "success", "folder_name": folder_name, 
                       "classified_files": classified_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/download_file/<folder_name>/<classification>/<filename>')
def download_file(folder_name, classification, filename):
    try:
        file_path = (os.path.join(folder_name, 'unclassified', filename) if classification == 'unclassified'
                    else os.path.join(folder_name, 'bids_output', 'sub-01', classification, filename))
        
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "File not found"}), 404
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/download_classification/<folder_name>/<classification>')
def download_classification(folder_name, classification):
    try:
        class_path = (os.path.join(folder_name, 'unclassified') if classification == 'unclassified'
                     else os.path.join(folder_name, 'bids_output', 'sub-01', classification))
        
        if not os.path.exists(class_path):
            return jsonify({"status": "error", "message": "Classification folder not found"}), 404
        
        zip_filename = f"{folder_name}_{classification}.zip"
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(class_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(file_path, os.path.relpath(file_path, class_path))
        
        return send_file(zip_filename, as_attachment=True, download_name=zip_filename)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/public_datasets', methods=['GET'])
def get_public_datasets():
    try:
        folders = []
        for item in os.listdir('.'):
            if item.startswith('temp_') and os.path.isdir(item):
                bids_path = os.path.join(item, 'bids_output', 'sub-01')
                if os.path.exists(bids_path):
                    classifications = {}
                    for datatype in ['anat', 'func', 'dwi', 'perf']:
                        dt_path = os.path.join(bids_path, datatype)
                        if os.path.exists(dt_path):
                            count = len([f for f in os.listdir(dt_path) if f.endswith(('.nii', '.nii.gz'))])
                            if count > 0:
                                classifications[datatype] = count
                    
                    unclass_path = os.path.join(item, 'unclassified')
                    if os.path.exists(unclass_path):
                        unclass_count = len([f for f in os.listdir(unclass_path) if f.endswith(('.nii', '.nii.gz'))])
                        if unclass_count > 0:
                            classifications['unclassified'] = unclass_count
                    
                    total_files = sum(classifications.values())
                    folders.append({
                        'id': item,
                        'name': f"Dataset {item.replace('temp_', '')}",
                        'total_files': total_files,
                        'upload_date': os.path.getctime(item),
                        'classifications': classifications,
                        'description': f"Medical imaging dataset with {total_files} files"
                    })
        
        return jsonify({"status": "success", "datasets": sorted(folders, key=lambda x: x['upload_date'], reverse=True)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)