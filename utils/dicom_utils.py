import os
import shutil
import pydicom

def is_dicom_file(filepath):
    """Check if a file is a valid DICOM file"""
    try:
        pydicom.dcmread(filepath, stop_before_pixels=True)
        return True
    except:
        return filepath.lower().endswith(('.dcm', '.dicom', '.ima'))

def consolidate_dicom_files(source_dir, target_dir):
    """
    Copy all DICOM files from source directory to target directory,
    maintaining the directory structure
    """
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

def get_files_in_dir(dir_path):
    """
    Get list of NIfTI files in a directory with metadata
    """
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