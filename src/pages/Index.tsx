import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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

function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant with access to your personal knowledge base. Upload documents to get started, then ask me questions based on your materials.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Getting Started Guide.txt',
      content: 'This is a sample document about how to use this AI assistant...',
      uploadDate: new Date(),
      size: '2.4 KB',
    },
    {
      id: '2',
      name: 'Project Notes.txt',
      content: 'Important notes about the current project...',
      uploadDate: new Date(),
      size: '1.8 KB',
    },
  ]);
  
  const [currentMessage, setCurrentMessage] = useState('');

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Based on your uploaded documents, I can help you with that. This response is generated from your knowledge base including "${documents[0].name}" and other relevant materials.`,
        isUser: false,
        timestamp: new Date(),
        sources: [documents[0].name, documents[1].name],
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setCurrentMessage('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        content: 'File content would be processed here...',
        uploadDate: new Date(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setDocuments(prev => [...prev, newDoc]);
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant</h1>
          <p className="text-gray-600">Your personal knowledge-based chat assistant</p>
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
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white border'
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
                      <Button onClick={sendMessage} className="px-6">
                        <Icon name="Send" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Knowledge Base</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {documents.length} documents loaded
                      </p>
                      <div className="space-y-1">
                        {documents.slice(0, 3).map((doc) => (
                          <div key={doc.id} className="text-xs p-2 bg-gray-50 rounded flex items-center gap-2">
                            <Icon name="FileText" size={12} />
                            <span className="truncate">{doc.name}</span>
                          </div>
                        ))}
                      </div>
                      {documents.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{documents.length - 3} more documents
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
                      <Button className="flex items-center gap-2">
                        <Icon name="Upload" size={16} />
                        Upload Document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Icon name="FileText" size={20} className="text-gray-500" />
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {doc.size} • {doc.uploadDate.toLocaleDateString()}
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
    </div>
  );
}

export default Index;