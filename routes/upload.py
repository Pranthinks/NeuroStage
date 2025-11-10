from flask import Blueprint, request, jsonify
import os, zipfile, subprocess, uuid, shutil, json
from utils.dicom_utils import consolidate_dicom_files
from utils.bids_utils import ensure_bids_valid
from config import DCM2BIDS_CONFIG

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload', methods=['POST'])
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