from flask import Blueprint, request, jsonify
import json
import os

auth_bp = Blueprint('auth', __name__)

USERS_FILE = 'users.json'

def load_users():
    try:
        return json.load(open(USERS_FILE)) if os.path.exists(USERS_FILE) else {}
    except:
        return {}

def save_users(users):
    json.dump(users, open(USERS_FILE, 'w'), indent=2)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    if data['email'] in load_users():
        return jsonify({'status': 'error', 'message': 'Email already registered'}), 400
    
    users = load_users()
    users[data['email']] = {k: data[k] for k in ['name', 'email', 'password']}
    save_users(users)
    return jsonify({'status': 'success', 'message': 'User registered successfully', 
                    'user': {'name': data['name'], 'email': data['email']}})

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'status': 'error', 'message': 'Missing email or password'}), 400
    
    user = load_users().get(data['email'])
    if user and user['password'] == data['password']:
        return jsonify({'status': 'success', 'message': 'Login successful', 
                       'user': {'name': user['name'], 'email': user['email']}})
    return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401