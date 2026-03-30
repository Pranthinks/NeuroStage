import os
import json

JSON_REPLACEMENTS = {
    "Manufacturer": "Siemens",
    "ManufacturersModelName": "MAGNETOM Prisma",
    "InstitutionName": "REDACTED",
    "InstitutionAddress": "REDACTED",
    "DeviceSerialNumber": "REDACTED",
    "ProcedureStepDescription": "REDACTED",
    "SoftwareVersions": "REDACTED",
    "StudyDescription": "REDACTED",
}

def anonymize_json_file(json_path: str) -> bool:
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        changed = False
        for key, val in JSON_REPLACEMENTS.items():
            if key in data:
                data[key] = val
                changed = True

        if changed:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

        return True
    except Exception as e:
        print(f"[JSON ANON ERROR] {json_path}: {e}")
        return False


def anonymize_json_directory(root_dir: str):
    anonymized = 0
    failed = 0

    for root, _, files in os.walk(root_dir):
        for fname in files:
            if not fname.lower().endswith(".json"):
                continue

            path = os.path.join(root, fname)
            ok = anonymize_json_file(path)

            if ok:
                anonymized += 1
            else:
                failed += 1

    return anonymized, failed
