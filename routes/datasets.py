from flask import Blueprint, jsonify
import os

datasets_bp = Blueprint('datasets', __name__)

@datasets_bp.route('/api/public_datasets', methods=['GET'])
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