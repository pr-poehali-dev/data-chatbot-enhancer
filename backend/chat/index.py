import json
import os
import requests
import psycopg2
import psycopg2.extras
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., pattern='^(user|assistant|system)$')
    content: str = Field(..., min_length=1)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    user_id: int = Field(..., gt=0)

def get_db_connection():
    """Get database connection using environment variable"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL not configured")
    return psycopg2.connect(database_url)

def create_embedding(text: str) -> Optional[List[float]]:
    """Create embedding for text query"""
    print(f"[DEBUG] Creating embedding for text: '{text[:100]}...'")
    
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        print("[ERROR] No OpenAI API key found")
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
            print("[DEBUG] Using proxy for OpenAI request")
        
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers=headers,
            json=data,
            timeout=10,
            proxies=proxies
        )
        
        if response.status_code == 200:
            embedding = response.json()['data'][0]['embedding']
            print(f"[DEBUG] Embedding created successfully, length: {len(embedding)}")
            return embedding
        else:
            print(f"[ERROR] OpenAI API error: {response.status_code}, {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] Failed to create embedding: {e}")
        return None

def search_documents(query: str, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """Search user documents using vector similarity"""
    print(f"[DEBUG] Starting document search for query: '{query}', user: {user_id}")
    
    query_embedding = create_embedding(query)
    if not query_embedding:
        print("[ERROR] Failed to create query embedding")
        return []
    
    print(f"[DEBUG] Query embedding created, length: {len(query_embedding)}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get all documents with embeddings for this user
        cursor.execute("""
            SELECT id, name, content, embedding
            FROM documents 
            WHERE embedding IS NOT NULL AND user_id = %s
        """, (user_id,))
        
        documents = cursor.fetchall()
        print(f"[DEBUG] Found {len(documents)} documents with embeddings for user {user_id}")
        
        results = []
        for row in documents:
            # Calculate cosine similarity
            doc_embedding = json.loads(row['embedding'])
            
            dot_product = sum(a * b for a, b in zip(query_embedding, doc_embedding))
            magnitude_query = sum(a * a for a in query_embedding) ** 0.5
            magnitude_doc = sum(a * a for a in doc_embedding) ** 0.5
            
            if magnitude_query > 0 and magnitude_doc > 0:
                similarity = dot_product / (magnitude_query * magnitude_doc)
            else:
                similarity = 0
            
            print(f"[DEBUG] Document '{row['name']}' similarity: {similarity:.4f}")
            
            # Lower threshold to 0.5 for better recall
            if similarity > 0.5:
                results.append({
                    'name': row['name'],
                    'content': row['content'],
                    'similarity': similarity
                })
        
        # Sort by similarity and return top results
        results.sort(key=lambda x: x['similarity'], reverse=True)
        results = results[:limit]
        
        print(f"[DEBUG] Returning {len(results)} relevant documents")
        
        cursor.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"[ERROR] Document search failed: {e}")
        return []

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: AI chat with semantic search over user documents
    Args: event - dict with httpMethod, body, headers
          context - object with request_id
    Returns: HTTP response with AI answer and sources
    """
    method: str = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    
    # Get user ID from header
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
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
    
    # Parse request body
    try:
        body_data = json.loads(event.get('body', '{}'))
        message = body_data.get('message', '')
        conversation_history = body_data.get('conversation_history', [])
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Invalid request: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    # Get API key
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI API key not configured'}),
            'isBase64Encoded': False
        }
    
    # Search relevant documents
    print(f"[INFO] Searching documents for user {user_id} with query: {message}")
    relevant_docs = search_documents(message, user_id)
    print(f"[INFO] Found {len(relevant_docs)} relevant documents")
    
    # Prepare conversation with context
    messages = []
    
    # System prompt with document context
    if relevant_docs:
        doc_context = "\n\n".join([
            f"Document: {doc['name']}\nContent: {doc['content']}"
            for doc in relevant_docs
        ])
        system_content = f"""You are a helpful AI assistant with access to the user's personal knowledge base. 
Use the following documents from their library to answer questions:

{doc_context}

When answering:
1. Base your response on the provided documents when relevant
2. If information isn't in the documents, you can provide general knowledge but mention it's not from their documents
3. Cite which documents you're referencing when using them
4. Be helpful and accurate
5. Respond in the same language as the user's question"""
    else:
        system_content = """You are a helpful AI assistant. The user has a document library, but no relevant documents were found for this query. 
Answer based on your general knowledge and mention that no relevant documents were found in their library."""
    
    messages.append({"role": "system", "content": system_content})
    
    # Add conversation history (last 10 messages)
    for msg in conversation_history[-10:]:
        messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
    
    # Add current message
    messages.append({"role": "user", "content": message})
    
    # Prepare OpenAI request
    openai_data = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    headers = {
        "Authorization": f"Bearer {openai_api_key}",
        "Content-Type": "application/json"
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
        # Make request to OpenAI
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=openai_data,
            proxies=proxies,
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'OpenAI API error',
                    'detail': response.text
                }),
                'isBase64Encoded': False
            }
        
        ai_response = response.json()['choices'][0]['message']['content']
        
        # Prepare response with sources
        result = {
            'response': ai_response,
            'sources': [doc['name'] for doc in relevant_docs],
            'documents_used': len(relevant_docs),
            'model_used': 'gpt-4o-mini'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"[ERROR] Chat processing failed: {e}")
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