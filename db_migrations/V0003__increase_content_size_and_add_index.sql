-- Увеличиваем размер колонки content для хранения файлов до 5MB
ALTER TABLE documents 
ALTER COLUMN content TYPE TEXT;

-- Добавим индекс на user_id для быстрого поиска документов пользователя
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);