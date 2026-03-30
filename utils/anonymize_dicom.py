import os
import pydicom
from pydicom.misc import is_dicom

# Replace ONLY these 8 fields with safe placeholder values (NOT empty)
REPLACEMENTS = {
    "Manufacturer": "Siemens",                      # (0008,0070)
    "ManufacturerModelName": "MAGNETOM Prisma",     # (0008,1090)
    "InstitutionName": "REDACTED",                  # (0008,0080)
    "InstitutionAddress": "REDACTED",               # (0008,0081)
    "DeviceSerialNumber": "REDACTED",               # (0018,1000)
    "PerformedProcedureStepDescription": "REDACTED",# (0040,0254)
    "SoftwareVersions": "REDACTED",                 # (0018,1020)
    "StudyDescription": "REDACTED",                 # (0008,1030)
}

def anonymize_dicom_file(input_path: str, output_path: str) -> bool:
    try:
        ds = pydicom.dcmread(input_path, force=True)

        for field, value in REPLACEMENTS.items():
            if field in ds:
                ds.data_element(field).value = value

        # Optional markers (does not remove anything else)
        ds.PatientIdentityRemoved = "YES"
        ds.DeidentificationMethod = "Replaced 8 fields with placeholders"

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        ds.save_as(output_path)
        return True

    except Exception as e:
        print(f"[DICOM ANON ERROR] {input_path}: {e}")
        return False


def anonymize_dicom_directory(input_dir: str, output_dir: str):
    anonymized = 0
    failed = 0

    for root, _, files in os.walk(input_dir):
        rel = os.path.relpath(root, input_dir)
        out_root = os.path.join(output_dir, rel)
        os.makedirs(out_root, exist_ok=True)

        for fname in files:
            in_path = os.path.join(root, fname)

            try:
                if not is_dicom(in_path):
                    continue
            except Exception:
                continue

            out_path = os.path.join(out_root, fname)

            if anonymize_dicom_file(in_path, out_path):
                anonymized += 1
            else:
                failed += 1

    return anonymized, failed
