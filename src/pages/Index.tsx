import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import LoginModal from '@/components/LoginModal';
import VideoModal from '@/components/VideoModal';
import AppHeader from '@/components/AppHeader';
import ChatTab from '@/components/ChatTab';
import LibraryTab from '@/components/LibraryTab';
import FileUploadPreview from '@/components/FileUploadPreview';
import { Message, Document } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface IndexProps {
  auth: {
    userId: number;
    username: string;
    token: string;
  } | null;
  onLogin: (userId: number, username: string, token: string) => void;
  onLogout: () => void;
}

function Index({ auth, onLogin, onLogout }: IndexProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant with access to your personal knowledge base. Upload documents to get started, then ask me questions based on your materials.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents from database on component mount
  const loadDocuments = async () => {
    if (!auth) return;
    

    try {
      const response = await fetch('https://functions.poehali.dev/390dcbc7-61d3-4aa3-a4e6-c4276be353cd', {
        method: 'GET',
        headers: {
          'X-User-Id': auth.userId.toString()
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedDocs = data.documents.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.name,
          content: doc.content,
          uploadDate: new Date(doc.created_at)
        }));
        setDocuments(formattedDocs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  useEffect(() => {
    if (auth) {
      loadDocuments();
    }
  }, [auth]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    if (!auth) {
      setShowLoginModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      // We don't need to send document contents anymore - backend will search them
      // based on the user's message using embeddings

      const response = await fetch('https://functions.poehali.dev/f4577fe4-cb11-4571-b7e5-32e9c0d072a2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': auth.userId.toString()
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I encountered an error processing your request.',
        isUser: false,
        timestamp: new Date(),
        sources: data.sources || [],
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting to the AI service. Please make sure the OpenAI API key is configured in the project settings.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset input
    event.target.value = '';
    
    if (!auth) {
      setShowLoginModal(true);
      return;
    }
    
    // For non-text files, show preview dialog
    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setSelectedFile(file);
      setShowFilePreview(true);
    } else {
      // For text files, upload directly
      setIsUploadingFile(true);
      try {
        const content = await file.text();
        await uploadTextContent(content, file.name);
      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось прочитать файл",
          variant: "destructive"
        });
      } finally {
        setIsUploadingFile(false);
      }
    }
  };
  
  const uploadTextContent = async (content: string, fileName: string) => {
    if (!auth) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/390dcbc7-61d3-4aa3-a4e6-c4276be353cd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': auth.userId.toString()
        },
        body: JSON.stringify({
          name: fileName,
          content: content,
          file_type: 'text/plain'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newDoc: Document = {
          id: data.id.toString(),
          name: fileName,
          content: content,
          uploadDate: new Date()
        };
        setDocuments(prev => [...prev, newDoc]);
        toast({
          title: "Успех!",
          description: "Документ успешно загружен",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Ошибка",
          description: errorData.error || "Не удалось загрузить документ",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    }
  };
  
  const handleFilePreviewConfirm = async (text: string, fileName: string) => {
    setIsUploadingFile(true);
    try {
      await uploadTextContent(text, fileName);
    } finally {
      setIsUploadingFile(false);
      setSelectedFile(null);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/390dcbc7-61d3-4aa3-a4e6-c4276be353cd?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': auth?.userId?.toString() || ''
        }
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        console.error('Delete failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        <AppHeader 
          auth={auth}
          onLogout={onLogout}
          onShowVideoModal={() => setShowVideoModal(true)}
          onShowLoginModal={() => setShowLoginModal(true)}
        />

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Icon name="MessageCircle" size={16} />
              Chat
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Icon name="Library" size={16} />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatTab
              messages={messages}
              documents={documents}
              currentMessage={currentMessage}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
              onMessageChange={setCurrentMessage}
              onSendMessage={sendMessage}
            />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LibraryTab
              documents={documents}
              isUploadingFile={isUploadingFile}
              onFileUpload={handleFileUpload}
              onDeleteDocument={deleteDocument}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={(userId, username, token) => {
          onLogin(userId, username, token);
          setShowLoginModal(false);
        }}
      />
      
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
      
      <FileUploadPreview
        file={selectedFile}
        isOpen={showFilePreview}
        onClose={() => {
          setShowFilePreview(false);
          setSelectedFile(null);
        }}
        onConfirm={handleFilePreviewConfirm}
      />
    </div>
  );
}

export default Index;