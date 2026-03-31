# NeuroStage

**A unified, web-based neuroimaging pipeline platform that takes you from raw DICOM scanner data to fully preprocessed, quality-controlled neuroimaging derivatives — entirely through a browser, with no programming required.**

---

## What is NeuroStage?

Neuroimaging research faces five interconnected barriers: technical complexity, high access costs, lack of transparency, scattered infrastructure, and limited computational resources. NeuroStage addresses all five simultaneously.

**Here is what NeuroStage does, from start to finish:**

1. **DICOM Ingestion** — Upload a ZIP file of raw DICOM files directly from your MRI scanner. The platform automatically finds all DICOM files regardless of how they are organised inside the ZIP.

2. **Anonymisation** — Before any conversion, NeuroStage strips identifying information (patient name, date of birth, medical record numbers, and other PHI) from DICOM headers while preserving all acquisition parameters needed for analysis.

3. **BIDS Conversion** — Raw DICOMs are automatically converted to [Brain Imaging Data Structure (BIDS)](https://bids.neuroimaging.io/) format using `dcm2bids`. Scans are classified into modality folders: anatomical (T1w/T2w), functional (BOLD), diffusion (DWI), and perfusion (ASL/PCASL).

4. **Interactive Visualisation & Validation** — After conversion, you can view every NIfTI file directly in the browser (slice navigation, contrast controls, multi-planar views). Review and confirm scan classifications before proceeding — catching misclassifications before they waste hours of computation.

5. **Quality Control with MRIQC** — Run [MRIQC](https://mriqc.readthedocs.io/) on any modality. Get HTML reports with SNR, tSNR, CNR, framewise displacement, DVARS, and artifact maps. This happens *before* preprocessing — bad data is identified before committing to 15–20 hour pipelines.

6. **Preprocessing Pipelines** — Launch modality-specific preprocessing pipelines directly from the browser:
   - **FreeSurfer** — Cortical surface reconstruction from T1w
   - **HCP Pipeline** — High-resolution surface-based analysis from T1w + T2w
   - **fMRIPrep** — Functional MRI preprocessing (motion correction, distortion correction, normalisation)
   - **QSIPrep** — Diffusion MRI preprocessing (eddy current correction, tractography-ready outputs)
   - **ASLPrep** — Perfusion imaging preprocessing and quantitative CBF map generation

7. **Results Viewer** — View HTML reports from any completed pipeline directly in the browser.

8. **Collaborative Data Sharing** — Share dataset metadata with collaborators through a privacy-preserving catalogue without exposing participant-level imaging data.

All pipelines run in isolated Docker containers. Processing is fault-tolerant — if a pipeline fails, completed stages are preserved and can be resumed from the failure point.

A live demo is available at: **https://neurostagedemo.onrender.com/**

---

## System Requirements

Before starting, make sure your system meets these requirements:

| Requirement | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 20.04 / macOS 12 | Ubuntu 22.04 / macOS 14 |
| RAM | 16 GB | 32 GB or more |
| Disk space | 100 GB free | 500 GB+ (pipelines produce large outputs) |
| CPU cores | 8 | 16+ |
| Internet | Required for setup | Required for pulling Docker images |

> **Windows** is not officially supported. Use WSL2 (Windows Subsystem for Linux) if you are on Windows.

---

## Prerequisites

You need three things installed before setting up NeuroStage:

1. [Anaconda or Miniconda](#1-install-anaconda)
2. [Node.js and npm](#2-install-nodejs-and-npm)
3. [Docker](#3-install-docker)

---

## Step-by-Step Setup

### 1. Install Anaconda

If you do not have Anaconda or Miniconda installed:

**Linux:**
```bash
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh
# Follow the prompts, then restart your terminal
```

**macOS:**
```bash
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh   # Apple Silicon
# OR
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh  # Intel Mac
bash Miniconda3-latest-*.sh
# Follow the prompts, then restart your terminal
```

Verify installation:
```bash
conda --version
```

Full Anaconda installer (includes GUI): https://www.anaconda.com/download

---

### 2. Install Docker

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group (so you don't need sudo every time)
sudo usermod -aG docker $USER
newgrp docker

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker  # start on boot
```

**macOS:**
Download and install Docker Desktop from: https://docs.docker.com/desktop/install/mac-install/

After installing, open Docker Desktop and wait for it to show "Docker is running."

Verify Docker is working:
```bash
docker --version
docker ps
```

---

### 3. Clone the Repository

```bash
git clone https://github.com/Pranthinks/NeuroStage.git
cd neurostage
```

---

### 4. Add Your FreeSurfer License

Several preprocessing pipelines (fMRIPrep, FreeSurfer, HCP, QSIPrep, ASLPrep) require a FreeSurfer license file. This is **free** — register here:

https://surfer.nmr.mgh.harvard.edu/registration.html

After registering, you will receive a `license.txt` file by email. Place it in the project root:

```bash
cp /path/to/your/license.txt ./license.txt
```

Your project root should look like this:
```
neurostage/
├── app.py
├── license.txt    ← here
├── requirements.txt
├── config.py
├── routes/
├── utils/
└── frontend/
```

---

### 5. Set Up the Python Backend

Create and activate a conda environment:

```bash
conda create -n neurostage python=3.10
conda activate neurostage
```

Install Node.js (v18 or higher) inside the conda environment:

```bash
conda install -c conda-forge nodejs
```

Verify Node.js:
```bash
node --version   # should show v18 or higher
npm --version    # should show 9 or higher
```

Install all Python dependencies:

```bash
pip install -r requirements.txt
```

Verify the key packages are installed:

```bash
python -c "import flask, docker, pydicom, nibabel; print('All packages OK')"
```

---

### 6. Set Up the Frontend

Navigate to the frontend folder and install dependencies:

```bash
cd frontend
npm install
```

If you see security vulnerability warnings, fix them:

```bash
npm audit fix
```

> If `npm audit fix` reports vulnerabilities that cannot be fixed automatically, run:
> ```bash
> npm audit fix --force
> ```
> This is safe for a development setup.

Start the frontend development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or whichever port Vite assigns — check the terminal output).

Leave this terminal running and open a new terminal for the backend.

---

### 7. Start the Backend

In a new terminal, activate the conda environment and start Flask:

```bash
conda activate neurostage
cd neurostage
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Running on http://0.0.0.0:5000
```

The backend API is now running at `http://localhost:5000`.

---

### 8. Pull Docker Images for Neuroimaging Pipelines

This is a **one-time step**. These images are large (5–15 GB each) so run this when you have a good internet connection. You do not need all of them — pull only the pipelines you plan to use.

```bash
# Quality Control (required — used for MRIQC)
docker pull nipreps/mriqc:latest

# Functional MRI preprocessing (pull if you have BOLD data)
docker pull nipreps/fmriprep:latest

# Diffusion MRI preprocessing (pull if you have DWI data)
docker pull pennbbl/qsiprep:latest

# Perfusion / ASL preprocessing (pull if you have ASL/PCASL data)
docker pull pennlinc/aslprep:latest

# Cortical surface reconstruction (pull if you have T1w data and want surfaces)
docker pull freesurfer/freesurfer:7.4.1
```

Verify images are downloaded:
```bash
docker images
```

You should see output like:
```
REPOSITORY                TAG       SIZE
nipreps/mriqc             latest    ~5 GB
nipreps/fmriprep          latest    ~15 GB
pennbbl/qsiprep           latest    ~10 GB
pennlinc/aslprep          latest    ~8 GB
freesurfer/freesurfer     7.4.1     ~12 GB
```

---

## Running NeuroStage

Every time you want to use NeuroStage, you need to start two processes:

**Terminal 1 — Frontend:**
```bash
conda activate neurostage
cd neurostage/frontend
npm run dev
```

**Terminal 2 — Backend:**
```bash
conda activate neurostage
cd neurostage
python app.py
```

Then open your browser and go to:
```
http://localhost:5173
```

> If you are running NeuroStage on a remote server and accessing it from another machine, replace `localhost` with the server's IP address.

---

## Using NeuroStage

### Create an Account
Register on the login page.

### Upload Data
1. Compress your DICOM folder into a ZIP file
2. Click **Upload** on the home page
3. Drag and drop your ZIP file
4. Wait for conversion to complete (time depends on dataset size)

### Review Classifications
After upload, go to **Dataset Classification & Quality Control**. Your scans will be sorted into:
- **Anatomical (T1w/T2w)**
- **Functional (BOLD)**
- **Diffusion (DWI)**
- **Perfusion (ASL)**
- **Unclassified** (anything that couldn't be automatically classified)

Click any NIfTI file to view it in the browser viewer.

### Run Quality Control
Click **Run Quality Control** on any modality card. MRIQC will run in a Docker container (15–30 minutes). When complete, click the report button to open the HTML quality report in a new tab.

### Run Preprocessing
Click the **Preprocessing Pipelines** tab. Select your dataset from the sidebar. Click **Run** on any pipeline. Pipelines run in Docker containers — processing times:

| Pipeline | Data type | Typical time |
|---|---|---|
| fMRIPrep | BOLD | 2–6 hours |
| QSIPrep | DWI | 2–4 hours |
| ASLPrep | ASL/PCASL | 1–3 hours |
| FreeSurfer | T1w | 8–12 hours |
| HCP Pipeline | T1w + T2w | 4–8 hours |

When complete, the pipeline card shows a **Reports** section. Click any report to view it in your browser.

---

## Project Structure

```
neurostage/
├── app.py                            # Flask application entry point
├── requirements.txt                  # Python dependencies
├── license.txt                       # FreeSurfer license (you provide this)
├── config.py                         # dcm2bids configuration
│
├── routes/
│   ├── auth.py                       # Login and registration
│   ├── upload.py                     # DICOM upload and BIDS conversion
│   ├── files.py                      # File serving and downloads
│   ├── mriqc.py                      # MRIQC quality control
│   ├── datasets.py                   # Public dataset catalogue
│   ├── fmriprep_preprocessing.py     # fMRIPrep pipeline
│   ├── qsiprep_preprocessing.py      # QSIPrep pipeline
│   └── aslprep_preprocessing.py      # ASLPrep pipeline
│
├── utils/
│   ├── preproc_utils.py              # Shared Docker utilities for all pipelines
│   ├── dicom_utils.py                # DICOM file handling
│   ├── bids_utils.py                 # BIDS validation helpers
│   ├── anonymize_dicom.py            # DICOM anonymisation
│   └── anonymize_json.py             # JSON sidecar anonymisation
│
└── frontend/
    ├── src/
    │   ├── App.jsx                   # Main app router
    │   ├── components/
    │   │   ├── MainPage.jsx          # Landing page
    │   │   ├── LoginPage.jsx         # Authentication
    │   │   ├── RegisterPage.jsx      # Registration
    │   │   ├── HomePage.jsx          # Upload dashboard
    │   │   ├── ClassifyPage.jsx      # File viewer and MRIQC
    │   │   ├── PreprocessingPage.jsx # Preprocessing pipeline UI
    │   │   ├── NiftiViewer.jsx       # In-browser NIfTI viewer
    │   │   ├── ClassificationCard.jsx
    │   │   ├── MriqcSection.jsx
    │   │   ├── MriqcConfirmationDialog.jsx
    │   │   ├── preprocessingUtils.jsx
    │   │   └── classifyUtils.jsx
    └── package.json
```

---

## Output Structure

After processing, outputs are stored inside the dataset folder (`temp_*/`):

```
temp_<id>/
├── bids_output/            # BIDS-converted data
│   └── sub-01/
│       ├── anat/           # T1w, T2w
│       ├── func/           # BOLD
│       ├── dwi/            # Diffusion
│       └── perf/           # ASL
├── unclassified/           # Files that could not be classified
├── mriqc_output_anat/      # MRIQC reports for anatomical
├── mriqc_output_func/      # MRIQC reports for functional
├── mriqc_output_dwi/       # MRIQC reports for diffusion
├── preproc_fmriprep/       # fMRIPrep outputs + HTML report
├── preproc_fmriprep_work/  # fMRIPrep working directory (can be deleted after)
├── preproc_qsiprep/        # QSIPrep outputs + HTML report
├── preproc_aslprep/        # ASLPrep outputs + HTML report
└── sourcedata_anonymized/  # Anonymised DICOMs (kept for audit)
```

> **Disk space note:** Working directories (`preproc_*_work/`) can be very large (50–100 GB for fMRIPrep). Delete them after processing is complete to free space:
> ```bash
> sudo rm -rf temp_*/preproc_*_work/
> ```

---

## Troubleshooting

### Docker permission denied
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Docker not running
```bash
# Linux
sudo systemctl start docker

# macOS — open Docker Desktop app and wait for it to show "running"
```

### Port 5000 already in use
```bash
# Find what is using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

### Frontend not connecting to backend
Make sure both servers are running. The frontend (port 5173) proxies API requests to the backend (port 5000). Check `vite.config.js` to confirm the proxy is set to `http://localhost:5000`.

### Pipeline output files owned by root (can't delete)
Docker containers sometimes write files as root. Use sudo to remove them:
```bash
sudo rm -rf temp_*/preproc_fmriprep
sudo rm -rf temp_*/preproc_fmriprep_work
```
This is fixed in the current version by passing user flags to Docker.

### FreeSurfer license error
Make sure `license.txt` is in the project root (same folder as `app.py`):
```bash
ls -la license.txt  # should exist
```

### dcm2bids not found after installing requirements
```bash
conda activate neurostage
pip install dcm2bids
```

### Pipeline starts then immediately fails
Check the container logs:
```bash
docker logs preproc_fmriprep_temp_1 --tail 50
# Replace fmriprep and temp_1 with your pipeline and dataset name
```

Or use the **Show logs** button on the pipeline card in the UI.

---

## Disk Space Management

Neuroimaging outputs are large. Each pipeline creates **two folders** — one for final results and one for intermediate working files. Only the results folder matters after processing is done.

### What each folder pair means

For every pipeline you run, you will see two folders inside your dataset directory (e.g. `temp_1/`):

| Folder | What it contains | Keep or delete? |
|---|---|---|
| `preproc_fmriprep/` | ✅ Final fMRIPrep outputs — preprocessed NIfTI files, HTML report | **Keep** |
| `preproc_fmriprep_work/` | ❌ Intermediate working files only — not needed after processing | **Delete** (50–100 GB) |
| `preproc_qsiprep/` | ✅ Final QSIPrep outputs — corrected DWI files, HTML report | **Keep** |
| `preproc_qsiprep_work/` | ❌ Intermediate working files only — not needed after processing | **Delete** (20–50 GB) |
| `preproc_aslprep/` | ✅ Final ASLPrep outputs — CBF maps, HTML report | **Keep** |
| `preproc_aslprep_work/` | ❌ Intermediate working files only — not needed after processing | **Delete** (10–30 GB) |
| `bids_output/` | ✅ Your BIDS-converted data | **Keep** |
| `sourcedata_anonymized/` | ✅ Anonymised DICOMs for audit trail | **Keep** |
| `mriqc_output_*/` | ✅ MRIQC quality control reports | **Keep** |

> **Simple rule: if the folder name ends in `_work/` — delete it. If it doesn't — keep it.**

### How to delete working directories after processing

Delete all working directories across all datasets at once:
```bash
sudo rm -rf temp_*/preproc_*_work/
```

Or delete for a specific dataset and pipeline:
```bash
# Example: delete only QSIPrep working files for dataset temp_1
sudo rm -rf temp_1/preproc_qsiprep_work/

# Example: delete only fMRIPrep working files for dataset temp_1
sudo rm -rf temp_1/preproc_fmriprep_work/
```

> `sudo` is needed because Docker may have written some files as root. This is safe — the `_work/` folders contain only temporary processing files, not your results.

---

## Citation

If you use NeuroStage in your research, please cite:

> Chunchu P., Rathi G.N., Mishra V.R. (2025). Democratizing Data Sharing and Processing of Routine MRI Data Acquired for Neuroimaging Research. *NeuroStage Platform*.

---

## Support

For issues, questions, or feature requests, open an issue on GitHub or contact the corresponding author:

**Virendra R. Mishra, PhD**
Department of Radiology, Heersink School of Medicine
University of Alabama at Birmingham (UAB)
Email: virendrarmishra@uabmc.edu