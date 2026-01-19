import { useEffect, useState } from 'react';
import { KioskMode } from '@/components/arcade/KioskMode';

export default function KioskPage() {
  const [config, setConfig] = useState({
    eventName: 'Story Arcade',
    welcomeMessage: 'Create Your Cinematic Story',
    primaryColor: 'cyan',
    accentColor: 'fuchsia',
    showQueue: false,
    queueCount: 0,
    estimatedWait: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventName = params.get('event');
    const welcomeMessage = params.get('message');
    const primaryColor = params.get('color');
    const accentColor = params.get('accent');
    
    if (eventName || welcomeMessage || primaryColor || accentColor) {
      setConfig(prev => ({
        ...prev,
        ...(eventName && { eventName }),
        ...(welcomeMessage && { welcomeMessage }),
        ...(primaryColor && { primaryColor }),
        ...(accentColor && { accentColor }),
      }));
    }
  }, []);

  return (
    <KioskMode config={config} />
  );
}
