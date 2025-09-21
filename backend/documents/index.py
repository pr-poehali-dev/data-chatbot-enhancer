import json
import os
import requests
import psycopg2
import psycopg2.extras
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import base64
from datetime import datetime

class DocumentUpload(BaseModel):
    name: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    file_type: str = Field(default="text/plain")

class EmbeddingRequest(BaseModel):
    text: str = Field(..., min_length=1)

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
        return None
    
    headers = {
        "Authorization": f"Bearer {openai_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "text-embedding-3-small",
        "input": text
    }
    
    # Check if proxy is configured
    proxy_url = os.getenv('PROXY_URL')
    proxies = {}
    if proxy_url:
        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers=headers,
            json=data,
            proxies=proxies if proxy_url else None,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result['data'][0]['embedding']
        return None
    except Exception:
        return None

def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    try:
        import math
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(a * a for a in vec2))
        if magnitude1 == 0 or magnitude2 == 0:
            return 0
        return dot_product / (magnitude1 * magnitude2)
    except:
        return 0

def search_similar_documents(query_embedding: List[float], limit: int = 5) -> List[Dict]:
    """Search for similar documents using vector similarity"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get all documents with embeddings
        cursor.execute("""
            SELECT id, name, content, file_type, created_at, embedding
            FROM documents 
            WHERE embedding IS NOT NULL
        """)
        
        results = []
        for row in cursor.fetchall():
            try:
                # Parse JSON embedding
                doc_embedding = json.loads(row['embedding'])
                similarity = calculate_cosine_similarity(query_embedding, doc_embedding)
                
                results.append({
                    'id': row['id'],
                    'name': row['name'],
                    'content': row['content'],
                    'file_type': row['file_type'],
                    'created_at': row['created_at'].isoformat(),
                    'similarity_score': similarity
                })
            except:
                continue
        
        # Sort by similarity and limit results
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        results = results[:limit]
        
        cursor.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"Search error: {e}")
        return []

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Manage document storage, embedding generation, and similarity search
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id for tracking
    Returns: HTTP response with document operations results
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        if method == 'GET':
            # Get all documents or search similar
            query_params = event.get('queryStringParameters', {}) or {}
            search_query = query_params.get('search')
            
            if search_query:
                # Create embedding for search query
                query_embedding = create_embedding(search_query)
                if query_embedding:
                    results = search_similar_documents(query_embedding)
                    return {
                        'statusCode': 200,
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'documents': results,
                            'search_query': search_query
                        })
                    }
            
            # Get all documents
            cursor.execute("""
                SELECT id, name, content, file_type, created_at, 
                       CASE WHEN embedding IS NOT NULL THEN true ELSE false END as has_embedding
                FROM documents 
                ORDER BY created_at DESC
            """)
            
            documents = []
            for row in cursor.fetchall():
                documents.append({
                    'id': row['id'],
                    'name': row['name'],
                    'content': row['content'][:500] + '...' if len(row['content']) > 500 else row['content'],
                    'file_type': row['file_type'],
                    'created_at': row['created_at'].isoformat(),
                    'has_embedding': row['has_embedding'],
                    'size': f"{len(row['content']) / 1024:.1f} KB"
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'documents': documents})
            }
        
        elif method == 'POST':
            # Upload new document
            body_data = json.loads(event.get('body', '{}'))
            doc_upload = DocumentUpload(**body_data)
            
            # Create embedding for the document
            embedding = create_embedding(doc_upload.content)
            embedding_str = None
            if embedding:
                embedding_str = json.dumps(embedding)
            
            # Insert document into database
            cursor.execute("""
                INSERT INTO documents (name, content, file_type, embedding, created_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                doc_upload.name,
                doc_upload.content,
                doc_upload.file_type,
                embedding_str,
                datetime.now()
            ))
            
            doc_id = cursor.fetchone()['id']
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': doc_id,
                    'message': 'Document uploaded successfully',
                    'has_embedding': embedding is not None
                })
            }
        
        elif method == 'DELETE':
            # Delete document
            query_params = event.get('queryStringParameters', {}) or {}
            doc_id = query_params.get('id')
            
            if not doc_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Document ID required'})
                }
            
            cursor.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Document deleted successfully'})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
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