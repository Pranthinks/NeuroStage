# NeuroStage

A web-based neuroimaging pipeline platform. Upload DICOM files, convert to BIDS format, run quality control with MRIQC, and preprocess with fMRIPrep, QSIPrep, and ASLPrep — all from a browser.

---

## Requirements

Before starting, make sure you have:

- **Linux or macOS** (Windows not tested)
- **Conda** — [install Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- **Docker** — [install Docker](https://docs.docker.com/get-docker/)
- **Node.js** (v18+) — [install Node.js](https://nodejs.org/)
- **A FreeSurfer license** — free from [surfer.nmr.mgh.harvard.edu](https://surfer.nmr.mgh.harvard.edu/registration.html)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/neurostage.git
cd neurostage
```

### 2. Create and activate conda environment

```bash
conda create -n neurostage python=3.10
conda activate neurostage
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Install dcm2bids

```bash
pip install dcm2bids
```

### 5. Place your FreeSurfer license

Copy your `license.txt` into the project root (same folder as `app.py`):

```bash
cp /path/to/your/license.txt ./license.txt
```

### 6. Install frontend dependencies and build

```bash
cd frontend
npm install
npm run build
cd ..
```

### 7. Start Docker

Make sure Docker is running:

```bash
# Linux
sudo systemctl start docker

# macOS — just open the Docker Desktop app
```

### 8. Pull neuroimaging pipeline Docker images

This is a one-time step. These images are large (5–15 GB each) so it will take a while:

```bash
# Required — Quality Control
docker pull nipreps/mriqc:latest

# Required — Functional MRI preprocessing
docker pull nipreps/fmriprep:latest

# Optional — Diffusion MRI preprocessing (pull only if you have DWI data)
docker pull pennbbl/qsiprep:latest

# Optional — Perfusion/ASL preprocessing (pull only if you have ASL data)
docker pull pennlinc/aslprep:latest

# Optional — Anatomical surface reconstruction (pull only if you have T1w data and want cortical surfaces)
docker pull freesurfer/freesurfer:7.4.1
```

### 9. Run the app

```bash
conda activate neurostage
python app.py
```

Open your browser and go to:
```
http://localhost:5000
```

---

## Usage

1. **Register/Login** — create an account on the login page
2. **Upload** — upload a ZIP file containing your DICOM files
3. **Classify** — your files are automatically sorted into anatomical, functional, diffusion, and perfusion categories
4. **Quality Control** — run MRIQC on any modality and view the HTML report
5. **Preprocess** — run fMRIPrep, QSIPrep, or ASLPrep on your data
6. **Results** — view HTML reports directly in the browser when processing is complete

---

## Project Structure

```
neurostage/
├── app.py                        # Flask app entry point
├── requirements.txt              # Python dependencies
├── license.txt                   # FreeSurfer license (you provide this)
├── config.py                     # dcm2bids configuration
├── routes/
│   ├── auth.py                   # Login and registration
│   ├── upload.py                 # DICOM upload and conversion
│   ├── files.py                  # File serving and downloads
│   ├── mriqc.py                  # MRIQC quality control
│   ├── fmriprep_preprocessing.py # fMRIPrep pipeline
│   ├── qsiprep_preprocessing.py  # QSIPrep pipeline
│   └── aslprep_preprocessing.py  # ASLPrep pipeline
├── utils/
│   ├── preproc_utils.py          # Shared Docker utilities
│   ├── dicom_utils.py            # DICOM file handling
│   └── bids_utils.py             # BIDS validation helpers
└── frontend/                     # React frontend
```

---

## Troubleshooting

**Docker permission denied**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port 5000 already in use**
```bash
# Find and kill the process using port 5000
lsof -i :5000
kill -9 <PID>
```

**dcm2bids not found**
```bash
conda activate neurostage
pip install dcm2bids
```

**FreeSurfer license error**
Make sure `license.txt` is in the project root folder (same directory as `app.py`).

**Pipeline output files owned by root (permission denied when deleting)**
```bash
sudo rm -rf temp_*/preproc_*
```
This happens when Docker writes files as root. Fixed in newer versions by passing user flags to Docker.

---

## Notes

- Only one preprocessing pipeline should run at a time — running multiple simultaneously will consume all available RAM and CPU
- Intermediate work files are stored in `temp_*/preproc_*_work/` and can be very large (50–100 GB for fMRIPrep). Delete them after processing is complete
- The app stores uploaded data in `temp_*/` folders in the project root. Back these up if needed

---

## Demo Account

A demo account is available on the login page:
- Email: `demo@demo.com`
- Password: `demo123`