import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Message, Document } from '@/types';

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
  return (
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
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                className="flex-1"
              />
              <Button onClick={onSendMessage} className="px-6" disabled={isLoading}>
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
  );
}

export default ChatTab;