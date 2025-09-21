import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AppHeaderProps {
  auth: {
    userId: number;
    username: string;
    token: string;
  } | null;
  onLogout: () => void;
  onShowVideoModal: () => void;
  onShowLoginModal: () => void;
}

export function AppHeader({ auth, onLogout, onShowVideoModal, onShowLoginModal }: AppHeaderProps) {
  return (
    <div className="mb-4 sm:mb-8 flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <img 
          src="https://cdn.poehali.dev/files/93f128c7-107b-4e97-8627-7bd8c980d13b.png" 
          alt="Matthew McConaughey"
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Alright AI
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
              onClick={onShowVideoModal}
            >
              <Icon name="CircleHelp" size={20} className="sm:w-6 sm:h-6" />
            </Button>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Matthew's personal app
          </p>
        </div>
      </div>
      
      {/* Auth section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {auth ? (
          <>
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Welcome, {auth.username}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="sm:flex items-center gap-2">
              <Icon name="LogOut" size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShowVideoModal}
              className="hidden sm:flex items-center gap-2"
            >
              <Icon name="Info" size={16} />
              What's this app about?
            </Button>
            <Button variant="default" size="sm" onClick={onShowLoginModal} className="flex items-center gap-2">
              <Icon name="LogIn" size={16} />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default AppHeader;