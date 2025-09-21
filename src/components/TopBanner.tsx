import Icon from '@/components/ui/icon';

export default function TopBanner() {
  return (
    <div className="relative w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      
      <div className="relative px-4 py-2 text-center">
        <p className="text-white text-sm font-medium flex items-center justify-center gap-2">
          <Icon name="Sparkles" size={16} className="text-yellow-300" />
          <span>This app built on</span>
          <a 
            href="https://poehali.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2 hover:text-yellow-300 transition-colors"
          >
            poehali.dev
          </a>
          <span>in 2 hours</span>
          <Icon name="Rocket" size={16} className="text-yellow-300" />
        </p>
      </div>
    </div>
  );
}