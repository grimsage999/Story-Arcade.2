import { useState, useEffect } from "react";

interface TextareaTooltipProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function TextareaTooltip({ isVisible, onDismiss }: TextareaTooltipProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!show) return null;

  return (
    <div 
      className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none z-10 animate-fade-in"
      data-testid="tooltip-textarea"
    >
      <div className="bg-card border border-primary/30 rounded-md px-4 py-2 shadow-lg shadow-primary/10">
        <p className="text-xs text-foreground font-mono">
          Write 1-2 sentences or a short paragraph. Be specific and creative!
        </p>
      </div>
    </div>
  );
}
