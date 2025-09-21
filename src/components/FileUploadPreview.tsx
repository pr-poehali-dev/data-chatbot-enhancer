import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { convertFileToText } from '@/utils/fileConverters';
import { toast } from '@/hooks/use-toast';

interface FileUploadPreviewProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string, fileName: string) => void;
}

export function FileUploadPreview({ file, isOpen, onClose, onConfirm }: FileUploadPreviewProps) {
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Process file when dialog opens
  React.useEffect(() => {
    if (isOpen && file) {
      processFile();
    }
  }, [isOpen, file]);
  
  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    const result = await convertFileToText(file);
    
    if (result.success) {
      setExtractedText(result.text);
    } else {
      setError(result.error || 'Не удалось обработать файл');
    }
    
    setIsProcessing(false);
  };
  
  const handleConfirm = () => {
    if (!extractedText.trim()) {
      toast({
        title: "Ошибка",
        description: "Текст не может быть пустым",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new filename with .txt extension
    const originalName = file?.name || 'document';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}.txt`;
    
    onConfirm(extractedText, newFileName);
    onClose();
    setExtractedText('');
    setError(null);
  };
  
  const handleCancel = () => {
    onClose();
    setExtractedText('');
    setError(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={20} />
            Предпросмотр извлеченного текста
          </DialogTitle>
          {file && (
            <p className="text-sm text-muted-foreground">
              Файл: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isProcessing && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Извлекаем текст из файла...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive">
                <Icon name="AlertCircle" size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {!isProcessing && !error && extractedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Извлечено символов: {extractedText.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Вы можете отредактировать текст перед сохранением
                </p>
              </div>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-[350px] border-0 p-0 resize-none focus:ring-0"
                  placeholder="Извлеченный текст появится здесь..."
                />
              </ScrollArea>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isProcessing || !!error || !extractedText.trim()}
          >
            <Icon name="Upload" size={16} className="mr-2" />
            Загрузить как текст
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FileUploadPreview;