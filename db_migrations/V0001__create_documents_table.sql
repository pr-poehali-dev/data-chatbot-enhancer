-- Create documents table for storing files and their embeddings
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_type VARCHAR(100) DEFAULT 'text/plain',
    embedding TEXT, -- Store embeddings as JSON text (simplified approach)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster document queries
CREATE INDEX IF NOT EXISTS documents_name_idx ON documents (name);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);