import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <div className="relative w-full">
          <video
            className="w-full h-auto rounded-lg"
            controls
            autoPlay
            src="http://cdn.poehali.dev/projects/8a5ad0f8-b4a5-4bba-9a47-2a8210c8b17d/IMG_0861.MP4"
          >
            Your browser does not support the video tag.
          </video>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VideoModal;