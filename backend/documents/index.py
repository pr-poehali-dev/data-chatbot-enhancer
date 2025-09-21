import json
import os
from typing import Dict, Any, List, Optional

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
        if method == 'GET':
            # Return mock data for now
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'documents': [
                        {
                            'id': 1,
                            'name': 'Test Document',
                            'content': 'This is a test document',
                            'file_type': 'text/plain',
                            'created_at': '2025-09-21T12:00:00Z',
                            'has_embedding': False
                        }
                    ]
                }),
                'isBase64Encoded': False
            }
            
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            print(f"[DEBUG] POST body: {body}")
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': 2,
                    'message': 'Document uploaded successfully',
                    'name': body.get('name', 'Unknown'),
                    'has_embedding': False
                }),
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