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
    <div className="mb-8 flex items-center gap-4">
      <img 
        src="https://cdn.poehali.dev/files/93f128c7-107b-4e97-8627-7bd8c980d13b.png" 
        alt="Matthew McConaughey"
        className="w-16 h-16 rounded-full object-cover"
      />
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-1">Alright AI</h1>
        <p className="text-muted-foreground flex items-center gap-1">
          Matthew's personal app
          <Button 
            variant="ghost" 
            size="icon"
            className="h-5 w-5 p-0"
            onClick={onShowVideoModal}
          >
            <Icon name="CircleHelp" size={14} />
          </Button>
        </p>
      </div>
      <div className="flex items-center gap-4">
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
    </div>
  );
}

export default AppHeader;