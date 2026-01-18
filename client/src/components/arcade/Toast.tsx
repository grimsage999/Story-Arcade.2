import { Sparkles } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold font-mono text-sm shadow-2xl animate-slide-in-from-bottom z-[100] flex items-center gap-2" data-testid="toast-notification">
      <Sparkles className="w-4 h-4 text-amber-500" /> {message}
    </div>
  );
}
