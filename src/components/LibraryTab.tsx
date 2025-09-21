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
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
      <div className="lg:col-span-2 flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 sm:py-4">
            <CardTitle className="text-lg sm:text-xl">Document Library</CardTitle>
            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                accept=".txt,.doc,.docx"
                onChange={onFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploadingFile || documents.length >= 20}
              />
              <Button className="flex items-center gap-2 w-full sm:w-auto text-sm" disabled={isUploadingFile}>
                {isUploadingFile ? (
                  <>
                    <Icon name="Loader2" size={14} className="animate-spin-slow" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={14} />
                    <span>Upload Document</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto py-3 sm:py-4">
            <div className="space-y-2 sm:space-y-3 overflow-hidden">
              {documents.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Icon name="FileX" size={40} className="mx-auto text-muted-foreground/30 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">No documents yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground/60 mb-4 sm:mb-6 px-4">
                    Upload your first document to start building your knowledge base
                  </p>
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept=".txt,.doc,.docx"
                      onChange={onFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploadingFile || documents.length >= 20}
                    />
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                      <Icon name="Upload" size={14} />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-accent/10 transition-all duration-200 animate-slide-up gap-2"
                  >
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                      <Icon name="FileText" size={18} className="text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-sm break-words">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.uploadDate.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground/60 truncate max-w-full overflow-hidden text-ellipsis">
                          {doc.content.slice(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="text-destructive hover:text-destructive ml-auto"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 lg:mt-0">
        <Card className="h-full">
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">Library Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-3 sm:py-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{documents.length} / 20</div>
              <p className="text-xs sm:text-sm text-gray-600">Total Documents</p>
              <p className="text-xs text-muted-foreground mt-1">Max 20 files</p>
            </div>

            <div className="pt-3 sm:pt-4 border-t">
              <h4 className="font-medium mb-2 text-sm">Supported Formats</h4>
              <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Icon name="FileText" size={10} className="sm:w-3 sm:h-3" />
                  Text Files (.txt)
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="FileText" size={10} className="sm:w-3 sm:h-3" />
                  Word Documents (.doc, .docx)
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