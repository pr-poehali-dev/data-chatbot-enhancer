import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <video
          className="w-full h-auto rounded-lg"
          controls
          autoPlay
          src="http://cdn.poehali.dev/projects/8a5ad0f8-b4a5-4bba-9a47-2a8210c8b17d/IMG_0861.MP4"
        >
          Your browser does not support the video tag.
        </video>
      </DialogContent>
    </Dialog>
  );
}

export default VideoModal;