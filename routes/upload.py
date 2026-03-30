from flask import Blueprint, request, jsonify
import os, zipfile, subprocess, uuid, shutil, json

from utils.dicom_utils import consolidate_dicom_files
from utils.bids_utils import ensure_bids_valid
from utils.anonymize_json import anonymize_json_directory
from utils.anonymize_dicom import anonymize_dicom_directory
from config import DCM2BIDS_CONFIG

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload', methods=['POST'])
def upload():
    temp_folder = f"temp_{str(uuid.uuid4())[:8]}"

    paths = {k: f"{temp_folder}/{v}" for k, v in {
        "extract": "extracted",
        "dicom_raw": "sourcedata_raw",
        "dicom_anon": "sourcedata_anonymized",
        "bids": "bids_output",
        "config": "config.json",
        "unclass": "unclassified",
        "zip": "input.zip",
    }.items()}

    try:
        os.makedirs(paths["extract"], exist_ok=True)
        os.makedirs(paths["dicom_raw"], exist_ok=True)
        os.makedirs(paths["dicom_anon"], exist_ok=True)
        os.makedirs(paths["unclass"], exist_ok=True)

        # 1) Save ZIP and unzip
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file provided"}), 400

        request.files["file"].save(paths["zip"])
        zipfile.ZipFile(paths["zip"]).extractall(paths["extract"])

        # 2) Consolidate DICOMs into a single raw folder
        dicom_count = consolidate_dicom_files(paths["extract"], paths["dicom_raw"])
        if dicom_count == 0:
            return jsonify({"status": "error", "message": "No DICOM files found in ZIP"}), 400

        # 3) Anonymize raw DICOMs (ONLY 8 fields) BEFORE dcm2bids
        dicom_anonymized, dicom_failed = anonymize_dicom_directory(
            input_dir=paths["dicom_raw"],
            output_dir=paths["dicom_anon"]
        )
        if dicom_anonymized == 0:
            return jsonify({
                "status": "error",
                "message": "DICOM anonymization produced 0 files. Check logs."
            }), 500

        # 4) Run dcm2bids on anonymized DICOM folder
        with open(paths["config"], "w") as f:
            json.dump(DCM2BIDS_CONFIG, f, indent=2)

        subprocess.run([
            "dcm2bids",
            "-d", paths["dicom_anon"],
            "-p", "sub-01",
            "-c", paths["config"],
            "-o", paths["bids"]
        ], check=True)

        # 5) (Optional) Anonymize JSON sidecars after BIDS conversion
        json_anonymized, json_failed = anonymize_json_directory(paths["bids"])
        print(f"Anonymized {json_anonymized} JSON files, {json_failed} failed")

        # 6) Validate BIDS
        ensure_bids_valid(paths["bids"])

        # 7) Move unclassified
        tmp_path = os.path.join(paths["bids"], "tmp_dcm2bids", "sub-01")
        if os.path.exists(tmp_path):
            for item in os.listdir(tmp_path):
                src = os.path.join(tmp_path, item)
                dst = os.path.join(paths["unclass"], item)
                if os.path.isfile(src):
                    shutil.move(src, dst)
                else:
                    shutil.copytree(src, dst)
            shutil.rmtree(os.path.join(paths["bids"], "tmp_dcm2bids"), ignore_errors=True)

        # 8) Clean extracted folder (keep temp_folder for outputs)
        shutil.rmtree(paths["extract"], ignore_errors=True)

        return jsonify({
            "status": "success",
            "message": (
                f"Done. Consolidated {dicom_count} DICOMs. "
                f"Anonymized {dicom_anonymized} DICOMs (failed: {dicom_failed}). "
                f"JSON anonymized: {json_anonymized} (failed: {json_failed})."
            ),
            "folder_path": temp_folder,
            "dicom_count": dicom_count,
            "dicom_anonymized": dicom_anonymized,
            "dicom_failed": dicom_failed,
            "json_anonymized": json_anonymized,
            "json_failed": json_failed
        }), 200

    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": f"dcm2bids failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
