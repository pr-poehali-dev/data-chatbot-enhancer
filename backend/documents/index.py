import json
import os
import psycopg2
import psycopg2.extras
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
import base64

def get_db_connection():
    """Get database connection using environment variable"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL not configured")
    return psycopg2.connect(database_url)

def create_embedding(text: str) -> Optional[List[float]]:
    """Create embedding for text using OpenAI API"""
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        print("[INFO] No OpenAI API key, skipping embedding")
        return None
    
    try:
        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "text-embedding-3-small",
            "input": text[:8000]  # Limit text length
        }
        
        # Check if proxy is configured
        proxy_url = os.getenv('PROXY_URL')
        proxies = {}
        if proxy_url:
            proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
            print("[INFO] Using proxy for OpenAI embedding request")
        
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers=headers,
            json=data,
            timeout=10,
            proxies=proxies
        )
        
        if response.status_code == 200:
            embedding = response.json()['data'][0]['embedding']
            print(f"[INFO] Created embedding with {len(embedding)} dimensions")
            return embedding
        else:
            print(f"[ERROR] OpenAI API error: {response.status_code}")
            return None
    except Exception as e:
        print(f"[ERROR] Failed to create embedding: {e}")
        return None

def search_similar_documents(query_embedding: List[float], user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar documents using cosine similarity"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get all documents with embeddings for this user
        cursor.execute("""
            SELECT id, name, content, file_type, created_at, embedding
            FROM documents 
            WHERE embedding IS NOT NULL AND user_id = %s
        """, (user_id,))
        
        results = []
        for row in cursor.fetchall():
            # Calculate cosine similarity
            doc_embedding = json.loads(row['embedding'])
            
            # Cosine similarity calculation
            dot_product = sum(a * b for a, b in zip(query_embedding, doc_embedding))
            magnitude_query = sum(a * a for a in query_embedding) ** 0.5
            magnitude_doc = sum(a * a for a in doc_embedding) ** 0.5
            
            if magnitude_query > 0 and magnitude_doc > 0:
                similarity = dot_product / (magnitude_query * magnitude_doc)
            else:
                similarity = 0
            
            results.append({
                'id': row['id'],
                'name': row['name'],
                'content': row['content'],
                'file_type': row['file_type'],
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'similarity_score': similarity
            })
        
        # Sort by similarity and return top results
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        results = results[:limit]
        
        cursor.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Document storage with PDF support and embeddings
    Args: event - HTTP event with method, headers, body
          context - function context
    Returns: HTTP response dict
    """
    print(f"[DEBUG] Request received")
    
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
                # Show preview of content in list
                content = row['content']
                if len(content) > 200:
                    content = content[:200] + '...'
                    
                documents.append({
                    'id': row['id'],
                    'name': row['name'],
                    'content': content,
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
            print(f"[DEBUG] Upload request for user {user_id}")
            
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            
            name = body.get('name', 'Untitled')
            content = body.get('content', '')
            file_type = body.get('file_type', 'text/plain')
            
            # Only accept text files
            if file_type != 'text/plain' and not name.endswith('.txt'):
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Only text files (.txt) are supported.'
                    }),
                    'isBase64Encoded': False
                }
            
            # Check file size limit (5MB)
            if len(content) > 5 * 1024 * 1024:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'File too large. Maximum size is 5MB.'
                    }),
                    'isBase64Encoded': False
                }
            
            # Check documents limit (20 per account)
            cursor.execute("""
                SELECT COUNT(*) as count FROM documents WHERE user_id = %s
            """, (user_id,))
            doc_count = cursor.fetchone()['count']
            
            if doc_count >= 20:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Document limit reached. Maximum 20 documents per account.'
                    }),
                    'isBase64Encoded': False
                }
            
            # Process content for embedding (only text files now)
            text_for_embedding = content
            content_to_save = content  # Store original content
            
            # Create embedding from text
            embedding = create_embedding(text_for_embedding)
            
            # Only save if we have embedding (no point storing without search capability)
            if not embedding:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Failed to create embedding. Please check if OpenAI API key is configured.'
                    }),
                    'isBase64Encoded': False
                }
            
            # Insert document with full content and embedding
            cursor.execute("""
                INSERT INTO documents (name, content, file_type, embedding, created_at, user_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                name,
                content_to_save,  # Store full content
                file_type,
                json.dumps(embedding),
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
                    'has_embedding': embedding is not None
                }),
                'isBase64Encoded': False
            }
            
        elif method == 'DELETE':
            # Delete document
            conn = get_db_connection()
            cursor = conn.cursor()
            
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