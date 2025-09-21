import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Document } from '@/types';

interface LibraryTabProps {
  documents: Document[];
  isUploadingFile: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument: (id: string) => void;
}

export function LibraryTab({
  documents,
  isUploadingFile,
  onFileUpload,
  onDeleteDocument
}: LibraryTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
      <div className="lg:col-span-2 flex flex-col h-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Document Library</CardTitle>
            <div className="relative">
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={onFileUpload}
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
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="FileX" size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No documents yet</h3>
                  <p className="text-sm text-muted-foreground/60 mb-6">
                    Upload your first document to start building your knowledge base
                  </p>
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={onFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploadingFile}
                    />
                    <Button variant="outline" className="flex items-center gap-2">
                      <Icon name="Upload" size={16} />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                documents.map((doc) => (
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
                      onClick={() => onDeleteDocument(doc.id)}
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
                ))
              )}
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
  );
}

export default LibraryTab;