from flask import Flask, request, send_file, jsonify
import os
import zipfile
import subprocess
import uuid
import shutil
import json

app = Flask(__name__)

# Routes
@app.route('/')
def home():
    return send_file('home.html')

@app.route('/classify')
def classify_page():
    return send_file('classify.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    temp_folder = f"temp_{str(uuid.uuid4())[:8]}"
    
    try:
        # Create directories
        for subdir in ['dicom', 'output']:
            os.makedirs(f"{temp_folder}/{subdir}", exist_ok=True)
        
        # Extract and convert
        zip_path = f"{temp_folder}/input.zip"
        file.save(zip_path)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(f"{temp_folder}/dicom")
        
        subprocess.run(["dcm2niix", "-o", f"{temp_folder}/output", "-f", "%p_%s", f"{temp_folder}/dicom"])
        
        return jsonify({"status": "success", "message": f"Conversion completed!", "folder_path": temp_folder})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_folders', methods=['GET'])
def get_folders():
    try:
        folders = []
        classification_folders = ['T1_scans', 'T2_scans', 'Diff_scans', 'Pcasl_scans', 'unclassified']
        
        for item in os.listdir('.'):
            if os.path.isdir(item) and item.startswith('temp_'):
                output_path = os.path.join(item, 'output')
                if os.path.exists(output_path):
                    # Count medical files
                    extensions = ['.nii', '.nii.gz', '.dcm', '.ima', '.img', '.hdr', '.mnc', '.mgh', '.mgz']
                    medical_files = [f for f in os.listdir(output_path) if any(f.endswith(ext) for ext in extensions)]
                    
                    folders.append({
                        'name': item,
                        'file_count': len(medical_files),
                        'created': os.path.getctime(item),
                        'has_classification': any(os.path.exists(os.path.join(item, cf)) for cf in classification_folders)
                    })
        
        folders.sort(key=lambda x: x['created'], reverse=True)
        return jsonify({"status": "success", "folders": folders})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_classified_files/<folder_name>', methods=['GET'])
def get_classified_files(folder_name):
    try:
        if not os.path.exists(folder_name):
            return jsonify({"status": "error", "message": "Folder not found"}), 404
        
        classified_data = {}
        classification_folders = ['T1_scans', 'T2_scans', 'Diff_scans', 'Pcasl_scans', 'unclassified']
        
        for classification in classification_folders:
            classification_path = os.path.join(folder_name, classification)
            files = []
            
            if os.path.exists(classification_path):
                # Group files by base name
                file_groups = {}
                for file in os.listdir(classification_path):
                    base_name = file.split('.')[0]
                    if base_name not in file_groups:
                        file_groups[base_name] = []
                    file_groups[base_name].append(file)
                
                # Process each group
                for base_name, group_files in file_groups.items():
                    main_file = next((f for f in group_files if f.endswith(('.nii.gz', '.nii'))), None)
                    json_file = next((f for f in group_files if f.endswith('.json')), None)
                    
                    if main_file:
                        file_path = os.path.join(classification_path, main_file)
                        files.append({
                            'base_name': base_name,
                            'main_file': main_file,
                            'json_file': json_file,
                            'other_files': [f for f in group_files if f not in [main_file, json_file]],
                            'total_files': len(group_files),
                            'file_size': os.path.getsize(file_path),
                            'modified': os.path.getmtime(file_path)
                        })
                
                files.sort(key=lambda x: x['base_name'])
            
            classified_data[classification] = files
        
        return jsonify({"status": "success", "folder_name": folder_name, "classified_files": classified_data})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/download_file/<folder_name>/<classification>/<filename>')
def download_file(folder_name, classification, filename):
    try:
        file_path = os.path.join('.', folder_name, classification, filename)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "File not found"}), 404
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/download_classification/<folder_name>/<classification>')
def download_classification(folder_name, classification):
    try:
        classification_path = os.path.join('.', folder_name, classification)
        if not os.path.exists(classification_path):
            return jsonify({"status": "error", "message": "Classification folder not found"}), 404
        
        zip_filename = f"{folder_name}_{classification}.zip"
        zip_path = os.path.join('.', zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(classification_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(file_path, os.path.relpath(file_path, classification_path))
        
        return send_file(zip_path, as_attachment=True, download_name=zip_filename)
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def classify_scan_type(json_data):
    """Classify scan using 75% scoring (3/4 criteria)"""
    try:
        series_desc = json_data.get('SeriesDescription', '').upper()
        inversion_time = json_data.get('InversionTime', None)
        flip_angle = json_data.get('FlipAngle', 0)
        scanning_sequence = json_data.get('ScanningSequence', '')
        
        # Define classification criteria
        criteria = {
            'T1': [
                series_desc.startswith('T1'),
                inversion_time is not None,
                flip_angle < 20,
                'GR' in scanning_sequence and 'IR' in scanning_sequence
            ],
            'T2': [
                series_desc.startswith('T2'),
                inversion_time is None,
                flip_angle > 100,
                'SE' in scanning_sequence
            ],
            'Diff': [
                series_desc.startswith('CMRR'),
                inversion_time is None,
                30 < flip_angle < 100,
                'EP' in scanning_sequence
            ],
            'Pcasl': [
                series_desc.startswith('TGSE'),
                inversion_time is None,
                flip_angle > 100,
                'EP' in scanning_sequence
            ]
        }
        
        # Find best match (need 3/4 criteria = 75%)
        best_score = 0
        best_type = 'unclassified'
        
        for scan_type, checks in criteria.items():
            score = sum(checks)
            if score >= 3 and score > best_score:
                best_score = score
                best_type = scan_type
        
        return best_type
        
    except Exception as e:
        print(f"Classification error: {e}")
        return 'unclassified'

@app.route('/classify_folder', methods=['POST'])
def classify_folder():
    folder_path = request.json.get('folder_path')
    
    try:
        output_path = os.path.join(folder_path, 'output')
        if not os.path.exists(output_path):
            return jsonify({"status": "error", "message": "Output folder not found"}), 400
        
        # Create classification folders
        classification_folders = {
            'T1': os.path.join(folder_path, 'T1_scans'),
            'T2': os.path.join(folder_path, 'T2_scans'),
            'Diff': os.path.join(folder_path, 'Diff_scans'),
            'Pcasl': os.path.join(folder_path, 'Pcasl_scans'),
            'unclassified': os.path.join(folder_path, 'unclassified')
        }
        
        for folder in classification_folders.values():
            os.makedirs(folder, exist_ok=True)
        
        # Process files
        counts = {k: 0 for k in classification_folders.keys()}
        json_files = [f for f in os.listdir(output_path) if f.endswith('.json')]
        
        for json_file in json_files:
            json_path = os.path.join(output_path, json_file)
            base_name = json_file.replace('.json', '')
            
            # Find related files
            related_files = [f for f in os.listdir(output_path) 
                           if f.startswith(base_name) and f != json_file and f.split('.')[0] == base_name]
            
            if not related_files:
                continue
            
            try:
                with open(json_path, 'r') as f:
                    json_data = json.load(f)
                
                scan_type = classify_scan_type(json_data)
                dest_folder = classification_folders[scan_type]
                counts[scan_type] += 1
                
                # Copy files
                shutil.copy2(json_path, os.path.join(dest_folder, json_file))
                for related_file in related_files:
                    shutil.copy2(os.path.join(output_path, related_file), 
                               os.path.join(dest_folder, related_file))
                
            except Exception as e:
                print(f"Error processing {json_file}: {e}")
                # Move to unclassified on error
                dest_folder = classification_folders['unclassified']
                counts['unclassified'] += 1
                shutil.copy2(json_path, os.path.join(dest_folder, json_file))
                for related_file in related_files:
                    shutil.copy2(os.path.join(output_path, related_file),
                               os.path.join(dest_folder, related_file))
        
        summary = [{"folder": f"{k}_scans" if k != 'unclassified' else k, "count": v} 
                  for k, v in counts.items()]
        
        return jsonify({
            "status": "success",
            "message": f"Classification completed! Processed {sum(counts.values())} files.",
            "summary": summary
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)