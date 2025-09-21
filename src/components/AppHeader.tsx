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
    <div className="mb-4 sm:mb-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <img 
          src="https://cdn.poehali.dev/files/93f128c7-107b-4e97-8627-7bd8c980d13b.png" 
          alt="Matthew McConaughey"
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
        />
        <div className="flex-1">
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
        
        {/* Mobile menu button or simplified auth */}
        <div className="sm:hidden">
          {auth ? (
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <Icon name="LogOut" size={20} />
            </Button>
          ) : (
            <Button variant="default" size="icon" onClick={onShowLoginModal}>
              <Icon name="LogIn" size={20} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Desktop auth section */}
      <div className="hidden sm:flex items-center gap-4 mt-4">
        {auth ? (
          <>
            <span className="text-sm text-muted-foreground">
              Welcome, {auth.username}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShowVideoModal}
            >
              <Icon name="Info" size={16} className="mr-2" />
              What's this app about?
            </Button>
            <Button variant="default" size="sm" onClick={onShowLoginModal}>
              <Icon name="LogIn" size={16} className="mr-2" />
              Sign In
            </Button>
          </>
        )}
      </div>
      
      {/* Mobile welcome message */}
      {auth && (
        <div className="sm:hidden mt-2">
          <span className="text-xs text-muted-foreground">
            Welcome, {auth.username}
          </span>
        </div>
      )}
    </div>
  );
}

export default AppHeader;