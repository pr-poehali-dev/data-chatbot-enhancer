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
      <div className="flex items-center gap-2 sm:gap-3">
        <img 
          src="https://cdn.poehali.dev/files/5aa3e9f7-8be1-4575-a81d-fe4fdaead930.png" 
          alt="Matthew McConaughey"
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alright AI</h1>
          <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-1">
            Matthew's personal app
            <Button 
              variant="ghost" 
              size="icon"
              className="h-4 w-4 sm:h-5 sm:w-5 p-0"
              onClick={onShowVideoModal}
            >
              <Icon name="CircleHelp" size={12} />
            </Button>
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