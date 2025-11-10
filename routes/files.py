from flask import Blueprint, request, jsonify, send_file
import os
import zipfile
from utils.dicom_utils import get_files_in_dir

files_bp = Blueprint('files', __name__)

@files_bp.route('/')
def home():
    return send_file('home.html')

@files_bp.route('/classify')
def classify_page():
    return send_file('classify.html')

@files_bp.route('/get_folders', methods=['GET'])
def get_folders():
    try:
        folders = []
        for item in os.listdir('.'):
            if item.startswith('temp_') and os.path.isdir(item):
                bids_path = os.path.join(item, 'bids_output')
                mriqc_path = os.path.join(item, 'mriqc_output')
                
                if os.path.exists(bids_path):
                    mriqc_status = 'not_started'
                    mriqc_reports = []
                    
                    if os.path.exists(mriqc_path):
                        html_files = [f for f in os.listdir(mriqc_path) if f.endswith('.html')]
                        if html_files:
                            mriqc_status = 'completed'
                            mriqc_reports = html_files
                        else:
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

@files_bp.route('/get_classified_files/<folder_name>', methods=['GET'])
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

@files_bp.route('/download_file/<folder_name>/<classification>/<filename>')
def download_file(folder_name, classification, filename):
    try:
        file_path = (os.path.join(folder_name, 'unclassified', filename) if classification == 'unclassified'
                    else os.path.join(folder_name, 'bids_output', 'sub-01', classification, filename))
        
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "File not found"}), 404
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@files_bp.route('/download_classification/<folder_name>/<classification>')
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

@files_bp.route('/view_file/<folder_name>/<classification>/<filename>')
def view_file(folder_name, classification, filename):
    """Serve NIfTI file for viewing in browser"""
    try:
        if classification == 'unclassified':
            file_path = os.path.join(folder_name, 'unclassified', filename)
        else:
            file_path = os.path.join(folder_name, 'bids_output', 'sub-01', classification, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'status': 'error', 'message': 'File not found'}), 404
        
        response = send_file(
            file_path,
            mimetype='application/gzip' if filename.endswith('.gz') else 'application/octet-stream',
            as_attachment=False,
            download_name=filename
        )
        
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cache-Control'] = 'no-cache'
        
        return response
        
    except Exception as e:
        print(f"Error serving file: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500