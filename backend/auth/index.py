import json
import os
import hashlib
import secrets
import psycopg2
import psycopg2.extras
from typing import Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4)

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4)

def get_db_connection():
    """Get database connection using environment variable"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL not configured")
    return psycopg2.connect(database_url)

def hash_password(password: str) -> str:
    """Hash password with salt using SHA256"""
    salt = "alright_alright_alright"  # Simple salt for demo
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Handle user authentication - login and registration
    Args: event - dict with httpMethod, body containing username/password
          context - object with request_id for tracking
    Returns: HTTP response with auth token or error
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Parse request body
    try:
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'login')
        
        if action == 'register':
            register_req = RegisterRequest(**body_data)
            username = register_req.username
            password = register_req.password
        else:
            login_req = LoginRequest(**body_data)
            username = login_req.username
            password = login_req.password
            
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Invalid request: {str(e)}'})
        }
    
    # Hash the password
    password_hash = hash_password(password)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        if action == 'register':
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 409,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username already exists'})
                }
            
            # Create new user
            cursor.execute("""
                INSERT INTO users (username, password_hash, created_at)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (username, password_hash, datetime.now()))
            
            user_id = cursor.fetchone()['id']
            conn.commit()
            
            # Generate token
            token = generate_token()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'user_id': user_id,
                    'username': username,
                    'token': token,
                    'message': 'Registration successful'
                })
            }
            
        else:  # Login
            # Check credentials
            cursor.execute("""
                SELECT id, username FROM users 
                WHERE username = %s AND password_hash = %s
            """, (username, password_hash))
            
            user = cursor.fetchone()
            
            if not user:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid username or password'})
                }
            
            # Update last login
            cursor.execute("""
                UPDATE users SET last_login = %s WHERE id = %s
            """, (datetime.now(), user['id']))
            conn.commit()
            
            # Generate token
            token = generate_token()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'user_id': user['id'],
                    'username': user['username'],
                    'token': token,
                    'message': 'Login successful'
                })
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Database operation failed',
                'detail': str(e)
            })
        }