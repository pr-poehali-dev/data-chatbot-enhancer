import json
import os
import requests
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., pattern='^(user|assistant|system)$')
    content: str = Field(..., min_length=1)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    documents: List[str] = Field(default_factory=list)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Process chat requests with OpenAI ChatGPT API and document context
    Args: event - dict with httpMethod, body containing message and context
          context - object with request_id for tracking
    Returns: HTTP response with AI-generated answer and sources
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
        chat_req = ChatRequest(**body_data)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Invalid request: {str(e)}'})
        }
    
    # Get API credentials
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OpenAI API key not configured'})
        }
    
    # Prepare conversation context
    messages = []
    
    # Add system prompt with document context
    if chat_req.documents:
        system_content = f"""You are a helpful AI assistant with access to the user's personal knowledge base. 
Use the following documents as context to answer questions:

{chr(10).join([f"Document: {doc}" for doc in chat_req.documents])}

When answering:
1. Base your response on the provided documents when relevant
2. If information isn't in the documents, clearly state that
3. Be helpful, accurate, and cite which documents you're referencing
4. Respond in the same language as the user's question"""
        messages.append({"role": "system", "content": system_content})
    else:
        messages.append({
            "role": "system", 
            "content": "You are a helpful AI assistant. Answer questions accurately and helpfully."
        })
    
    # Add conversation history
    for msg in chat_req.conversation_history[-10:]:  # Keep last 10 messages
        messages.append({"role": msg.role, "content": msg.content})
    
    # Add current user message
    messages.append({"role": "user", "content": chat_req.message})
    
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
        # Make request to OpenAI API
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=openai_data,
            proxies=proxies if proxy_url else None,
            timeout=30
        )
        
        if response.status_code != 200:
            error_detail = response.text if response.text else f"HTTP {response.status_code}"
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'OpenAI API error',
                    'detail': error_detail
                })
            }
        
        openai_response = response.json()
        ai_message = openai_response['choices'][0]['message']['content']
        
        # Determine which documents were likely referenced
        referenced_docs = []
        if chat_req.documents:
            # Simple heuristic: if response mentions document content, mark as referenced
            for doc in chat_req.documents:
                if any(word in ai_message.lower() for word in doc.lower().split()[:3]):
                    referenced_docs.append(doc)
        
        result = {
            'response': ai_message,
            'sources': referenced_docs,
            'request_id': context.request_id,
            'model_used': 'gpt-4o-mini'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
        
    except requests.exceptions.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Network error connecting to OpenAI',
                'detail': str(e)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Internal server error',
                'detail': str(e)
            })
        }