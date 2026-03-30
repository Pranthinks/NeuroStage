"""
Shared utilities for all preprocessing pipelines.
Handles Docker container management, status checking, and output discovery.
"""
import os
import docker
import time


# ── License ───────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # routes/ -> project root
FS_LICENSE = os.path.join(BASE_DIR, 'license.txt')


# ── Docker helpers ────────────────────────────────────────────────────

def get_docker():
    return docker.from_env()

def remove_old_container(name):
    try:
        get_docker().containers.get(name).remove(force=True)
    except Exception:
        pass

def get_container_status(name):
    """Returns Docker status string or 'not_found'"""
    try:
        return get_docker().containers.get(name).status
    except docker.errors.NotFound:
        return 'not_found'
    except Exception:
        return 'error'

def get_container_logs(name, tail=200):
    """Returns last N lines of container logs as a string"""
    try:
        container = get_docker().containers.get(name)
        return container.logs(tail=tail).decode('utf-8', errors='replace'), container.status
    except docker.errors.NotFound:
        return 'Container not found', 'not_found'
    except Exception as e:
        return str(e), 'error'


# ── Pipeline status ───────────────────────────────────────────────────

def get_pipeline_status(output_dir, container_name):
    """
    Checks output dir + container state to return pipeline status.
    Returns: 'not_started' | 'running' | 'completed' | 'failed'
    """
    if not os.path.exists(output_dir):
        return 'not_started'

    running_file = os.path.join(output_dir, '.pipeline_running')
    container_status = get_container_status(container_name)

    if container_status == 'running':
        return 'running'

    # Container stopped — clean up running file
    if os.path.exists(running_file):
        os.remove(running_file)

    # Check for output files (sub-* folders or HTML reports)
    files = os.listdir(output_dir)
    if any(f.startswith('sub-') or f.endswith('.html') for f in files):
        return 'completed'

    return 'not_started'


# ── Output discovery ──────────────────────────────────────────────────

def find_html_reports(output_dir):
    """Returns list of HTML report filenames found in output_dir"""
    if not os.path.exists(output_dir):
        return []
    return [f for f in os.listdir(output_dir) if f.endswith('.html')]

def find_output_files(output_dir):
    """
    Returns a simple summary of output files grouped by subfolder.
    Only goes one level deep — keeps it simple.
    """
    if not os.path.exists(output_dir):
        return {}

    result = {}
    for item in os.listdir(output_dir):
        item_path = os.path.join(output_dir, item)
        # Skip hidden files and work dirs
        if item.startswith('.'):
            continue
        if os.path.isdir(item_path):
            files = [
                f for f in os.listdir(item_path)
                if not f.startswith('.')
            ]
            result[item] = files
        else:
            result.setdefault('root', []).append(item)

    return result


# ── Container runner ──────────────────────────────────────────────────

def run_container(image, command, volumes, container_name, output_dir):
    """
    Pull image if needed, start container detached, verify it started.
    Returns: (success: bool, message: str, container_id: str or None)
    """
    running_file = os.path.join(output_dir, '.pipeline_running')

    try:
        client = get_docker()

        # Pull image if not present
        try:
            client.images.get(image)
        except docker.errors.ImageNotFound:
            print(f"Pulling {image} ...")
            client.images.pull(image)

        remove_old_container(container_name)

        os.makedirs(output_dir, exist_ok=True)
        with open(running_file, 'w') as f:
            f.write('running')

        print(f"Starting container: {container_name}")

        container = client.containers.run(
            image=image,
            command=command,
            volumes=volumes,
            user=f'{os.getuid()}:{os.getgid()}',
            name=container_name,
            remove=False,
            detach=True
        )

        # Wait 2s and confirm it didn't crash immediately
        time.sleep(2)
        container.reload()

        if container.status not in ('running', 'created'):
            logs = container.logs().decode('utf-8', errors='replace')
            if os.path.exists(running_file):
                os.remove(running_file)
            return False, logs, None

        return True, 'started', container.id[:12]

    except Exception as e:
        if os.path.exists(running_file):
            os.remove(running_file)
        return False, str(e), None