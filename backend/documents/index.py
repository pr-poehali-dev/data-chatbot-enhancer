import json
import os
import psycopg2
import psycopg2.extras
from typing import Dict, Any, List, Optional
from datetime import datetime

def get_db_connection():
    """Get database connection using environment variable"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL not configured")
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Simple document storage test
    Args: event - HTTP event with method, headers, body
          context - function context
    Returns: HTTP response dict
    """
    print(f"[DEBUG] Full event: {json.dumps(event)}")
    
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    
    # Get user ID from header
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    print(f"[DEBUG] Method: {method}, User-ID: {user_id}")
    
    # Always handle OPTIONS first
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Check auth
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Missing X-User-Id header'}),
            'isBase64Encoded': False
        }
    
    try:
        user_id = int(user_id)
    except:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid user ID'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        if method == 'GET':
            # Get all documents from database
            cursor.execute("""
                SELECT id, name, content, file_type, created_at, 
                       CASE WHEN embedding IS NOT NULL THEN true ELSE false END as has_embedding
                FROM documents 
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            
            documents = []
            for row in cursor.fetchall():
                documents.append({
                    'id': row['id'],
                    'name': row['name'],
                    'content': row['content'],
                    'file_type': row['file_type'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                    'has_embedding': row['has_embedding']
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'documents': documents}),
                'isBase64Encoded': False
            }
            
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            print(f"[DEBUG] POST body: {body}")
            
            # Insert document into database
            cursor.execute("""
                INSERT INTO documents (name, content, file_type, created_at, user_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                body.get('name', 'Untitled'),
                body.get('content', ''),
                body.get('file_type', 'text/plain'),
                datetime.now(),
                user_id
            ))
            
            doc_id = cursor.fetchone()['id']
            conn.commit()
            
            print(f"[INFO] Document {doc_id} created for user {user_id}")
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': doc_id,
                    'message': 'Document uploaded successfully',
                    'has_embedding': False
                }),
                'isBase64Encoded': False
            }
            
        elif method == 'DELETE':
            # Delete document
            query_params = event.get('queryStringParameters', {}) or {}
            doc_id = query_params.get('id')
            
            if not doc_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Document ID required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                DELETE FROM documents 
                WHERE id = %s AND user_id = %s
                RETURNING id
            """, (doc_id, user_id))
            
            deleted = cursor.fetchone()
            if not deleted:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Document not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Document deleted successfully'}),
                'isBase64Encoded': False
            }
            
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        print(f"[ERROR] Exception: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'detail': str(e)
            }),
            'isBase64Encoded': False
        }