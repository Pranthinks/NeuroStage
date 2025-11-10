from flask import Flask
from routes.auth import auth_bp
from routes.upload import upload_bp
from routes.files import files_bp
from routes.mriqc import mriqc_bp
from routes.datasets import datasets_bp

app = Flask(__name__)

# Register all blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(files_bp)
app.register_blueprint(mriqc_bp)
app.register_blueprint(datasets_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)