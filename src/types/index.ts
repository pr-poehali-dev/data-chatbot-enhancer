export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: string[];
}

export interface Document {
  id: string;
  name: string;
  content: string;
  uploadDate: Date;
  size: string;
}