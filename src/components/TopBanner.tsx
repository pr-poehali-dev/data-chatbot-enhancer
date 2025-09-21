import Icon from '@/components/ui/icon';

export default function TopBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 w-full bg-[#fbb040] overflow-hidden z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      
      <div className="relative px-4 py-2 text-center">
        <p className="text-black text-sm font-medium flex items-center justify-center gap-2">
          <Icon name="Rocket" size={16} className="text-black" />
          <span>This app built on</span>
          <a 
            href="https://poehali.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2 hover:text-gray-700 transition-colors"
          >
            poehali.dev
          </a>
          <span>in 2 hours</span>
        </p>
      </div>
    </div>
  );
}