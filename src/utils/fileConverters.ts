import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
// Try multiple CDN sources for better reliability
const cdnSources = [
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
];

// Use the first available CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = cdnSources[0];

export interface ConversionResult {
  success: boolean;
  text: string;
  error?: string;
}

export async function convertPdfToText(file: File): Promise<ConversionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Try to load with worker disabled as fallback
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // Disable worker to avoid CORS issues
      disableWorker: true,
      // Use legacy build for better compatibility
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    // Clean up the text
    fullText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (!fullText) {
      return {
        success: false,
        text: '',
        error: 'Не удалось извлечь текст из PDF. Возможно, это отсканированный документ.'
      };
    }
    
    return {
      success: true,
      text: fullText
    };
  } catch (error) {
    console.error('PDF conversion error:', error);
    
    // More detailed error message
    let errorMessage = 'Ошибка при чтении PDF файла. ';
    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        errorMessage += 'Попробуйте перезагрузить страницу.';
      } else {
        errorMessage += error.message;
      }
    }
    
    return {
      success: false,
      text: '',
      error: errorMessage
    };
  }
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
  
  // PDF files
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return convertPdfToText(file);
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
    error: 'Неподдерживаемый формат файла. Поддерживаются: .txt, .pdf, .doc, .docx'
  };
}