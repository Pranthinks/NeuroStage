import boto3
from pathlib import Path

# Your Cloudflare R2 credentials
ACCOUNT_ID = '4b6345d06c055daa880b79c62253c5cc'
ACCESS_KEY = '244beb998f11852fbb98454a3a4c344e' 
SECRET_KEY = 'b6376ecc8942fb6a2d15326ffc563fe7696b6aafc234413ae7c5ac1d7a44a23d'
FOLDER = '/home/praneeth/Downloads/Work_Dicom/temp_dataset1'

s3 = boto3.client('s3', 
    endpoint_url=f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=ACCESS_KEY, 
    aws_secret_access_key=SECRET_KEY)

folder_path = Path(FOLDER)
for file in folder_path.rglob('*'):
    if file.is_file():
        # Preserve folder structure
        relative_path = file.relative_to(folder_path)
        s3_key = f'scans/{relative_path}'
        s3.upload_file(str(file), 'dicomdata', str(s3_key))
        print(f'Uploaded: {relative_path}')