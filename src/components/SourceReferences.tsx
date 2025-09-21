import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Source {
  id: number;
  name: string;
  relevance: number;
}

interface SourceReferencesProps {
  sources: Source[];
}

export function SourceReferences({ sources }: SourceReferencesProps) {
  if (!sources || sources.length === 0) return null;
  
  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="BookOpen" size={12} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Источники</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <div 
            key={source.id}
            className="group flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 hover:bg-accent/20 rounded-full transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center">
              {source.id}
            </span>
            <span className="text-xs text-foreground/70 group-hover:text-foreground/90">
              {source.name}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              {(source.relevance * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SourceReferences;