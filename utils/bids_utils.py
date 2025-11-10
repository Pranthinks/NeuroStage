import os
import json

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
