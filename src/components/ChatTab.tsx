import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Message, Document } from '@/types';
import { SourceReferences } from '@/components/SourceReferences';
import { useState } from 'react';

interface ChatTabProps {
  messages: Message[];
  documents: Document[];
  currentMessage: string;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatTab({
  messages,
  documents,
  currentMessage,
  isLoading,
  messagesEndRef,
  onMessageChange,
  onSendMessage
}: ChatTabProps) {
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Mobile toggle for knowledge base */}
      <div className="lg:hidden flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Chat Assistant</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
          className="text-xs"
        >
          <Icon name={showKnowledgeBase ? "X" : "Database"} size={14} className="mr-1" />
          {showKnowledgeBase ? 'Hide' : 'Knowledge'} ({documents.length})
        </Button>
      </div>
      
      {/* Mobile knowledge base */}
      {showKnowledgeBase && (
        <Card className="lg:hidden mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No documents uploaded
                </p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="text-xs p-1.5 bg-accent/10 rounded flex items-center gap-1.5">
                    <Icon name="FileText" size={10} className="flex-shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main chat area */}
      <div className="lg:col-span-3">
        <Card className="h-[calc(100vh-300px)] sm:h-[600px] flex flex-col">
          <CardHeader className="border-b py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Icon name="Bot" size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Chat Assistant</span>
            </CardTitle>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 animate-slide-up ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.sources && <SourceReferences sources={message.sources as any} />}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-lg p-2.5 sm:p-3 flex items-center gap-2 animate-pulse-blue">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-3 sm:p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your documents..."
                value={currentMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                className="flex-1 text-sm"
              />
              <Button onClick={onSendMessage} size="default" className="px-3 sm:px-6" disabled={isLoading}>
                <Icon name="Send" size={14} className="sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Desktop knowledge base */}
      <div className="hidden lg:block lg:col-span-1">
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
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="FolderOpen" size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-xs text-muted-foreground/60">
                      No documents uploaded yet
                    </p>
                    <p className="text-xs text-muted-foreground/40 mt-1">
                      Go to Library tab to upload
                    </p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="text-xs p-2 bg-accent/10 rounded flex items-center gap-2">
                      <Icon name="FileText" size={12} className="flex-shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ChatTab;