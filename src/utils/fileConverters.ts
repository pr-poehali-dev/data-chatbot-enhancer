import mammoth from 'mammoth';

export interface ConversionResult {
  success: boolean;
  text: string;
  error?: string;
}

export async function convertWordToText(file: File): Promise<ConversionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value) {
      return {
        success: false,
        text: '',
        error: 'Не удалось извлечь текст из документа Word'
      };
    }
    
    // Clean up the text
    const cleanText = result.value
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return {
      success: true,
      text: cleanText
    };
  } catch (error) {
    console.error('Word conversion error:', error);
    return {
      success: false,
      text: '',
      error: 'Ошибка при чтении документа Word'
    };
  }
}

export async function convertFileToText(file: File): Promise<ConversionResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  // Plain text files - just read as is
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    try {
      const text = await file.text();
      return { success: true, text };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: 'Ошибка при чтении текстового файла'
      };
    }
  }
  
  // Word files
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword' ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')
  ) {
    return convertWordToText(file);
  }
  
  return {
    success: false,
    text: '',
    error: 'Неподдерживаемый формат файла. Поддерживаются: DOC, DOCX, TXT'
  };
}