export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<{
    id: number;
    name: string;
    relevance: number;
  }>;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  uploadDate: Date;
}