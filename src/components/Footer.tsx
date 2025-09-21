import Icon from '@/components/ui/icon';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Icon name="Package" size={14} className="sm:w-4 sm:h-4" />
          <span>Built in 2 hours on</span>
          <a 
            href="https://poehali.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-white hover:underline flex items-center gap-1"
          >
            poehali.dev
            <Icon name="ExternalLink" size={10} className="sm:w-3 sm:h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;