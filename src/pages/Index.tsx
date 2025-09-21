import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Cookies from 'js-cookie';
import LoginModal from '@/components/LoginModal';
import VideoModal from '@/components/VideoModal';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: string[];
}

interface Document {
  id: string;
  name: string;
  content: string;
  uploadDate: Date;
  size: string;
}

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
          'Authorization': `Bearer ${auth.userId}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedDocs = data.documents.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.name,
          content: doc.content,
          uploadDate: new Date(doc.created_at),
          size: doc.size,
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

      // Get document contents for context - use full content for better context
      const documentContents = documents.map(doc => {
        // For chat context, we need the full content, not the truncated version
        return `${doc.name}: ${doc.content}`;
      });

      const response = await fetch('https://functions.poehali.dev/f4577fe4-cb11-4571-b7e5-32e9c0d072a2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_history: conversationHistory,
          documents: documentContents
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
    if (file) {
      if (!auth) {
        setShowLoginModal(true);
        event.target.value = '';
        return;
      }
      setIsUploadingFile(true);
      try {
        const text = await file.text();
        
        // Upload to backend
        const response = await fetch('https://functions.poehali.dev/390dcbc7-61d3-4aa3-a4e6-c4276be353cd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.userId}`
          },
          body: JSON.stringify({
            name: file.name,
            content: text,
            file_type: file.type || 'text/plain'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const newDoc: Document = {
            id: data.id,
            name: file.name,
            content: text, // Store full content for chat context
            uploadDate: new Date(),
            size: `${(file.size / 1024).toFixed(1)} KB`,
          };
          setDocuments(prev => [...prev, newDoc]);
        } else {
          console.error('Upload failed:', response.statusText);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/390dcbc7-61d3-4aa3-a4e6-c4276be353cd?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.userId}`
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
        <div className="mb-8 flex items-center gap-4">
          <img 
            src="https://cdn.poehali.dev/files/93f128c7-107b-4e97-8627-7bd8c980d13b.png" 
            alt="Matthew McConaughey"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">Alright AI</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              Matthew's personal app
              <Button 
                variant="ghost" 
                size="icon"
                className="h-5 w-5 p-0"
                onClick={() => setShowVideoModal(true)}
              >
                <Icon name="CircleHelp" size={14} />
              </Button>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {auth ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {auth.username}
                </span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <Icon name="LogOut" size={16} className="mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowVideoModal(true)}
                >
                  <Icon name="Info" size={16} className="mr-2" />
                  What's this app about?
                </Button>
                <Button variant="default" size="sm" onClick={() => setShowLoginModal(true)}>
                  <Icon name="LogIn" size={16} className="mr-2" />
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Bot" size={20} />
                      Chat Assistant
                    </CardTitle>
                  </CardHeader>
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 animate-slide-up ${
                              message.isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.sources && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {message.sources.map((source, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <Icon name="FileText" size={10} className="mr-1" />
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-card border rounded-lg p-3 flex items-center gap-2 animate-pulse-blue">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a question about your documents..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} className="px-6" disabled={isLoading}>
                        <Icon name="Send" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-lg">Knowledge Base</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <p className="text-sm text-gray-600 mb-3 flex-shrink-0">
                        {documents.length} documents loaded
                      </p>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="text-xs p-2 bg-accent/10 rounded flex items-center gap-2">
                            <Icon name="FileText" size={12} className="flex-shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
              <div className="lg:col-span-2 flex flex-col h-full">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Document Library</CardTitle>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button className="flex items-center gap-2" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Icon name="Loader2" size={16} className="animate-spin-slow" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Icon name="Upload" size={16} />
                            Upload Document
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/10 transition-all duration-200 animate-slide-up"
                        >
                          <div className="flex items-center gap-3">
                            <Icon name="FileText" size={20} className="text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.size} • {doc.uploadDate.toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground/60 truncate max-w-[300px]">
                                {doc.content.slice(0, 100)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Icon name="Eye" size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Library Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{documents.length}</div>
                      <p className="text-sm text-gray-600">Total Documents</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {documents.reduce((acc, doc) => acc + parseFloat(doc.size), 0).toFixed(1)}
                      </div>
                      <p className="text-sm text-gray-600">Total Size (KB)</p>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Supported Formats</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" size={12} />
                          Text Files (.txt)
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="File" size={12} />
                          PDF Documents
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" size={12} />
                          Word Documents
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
    </div>
  );
}

export default Index;