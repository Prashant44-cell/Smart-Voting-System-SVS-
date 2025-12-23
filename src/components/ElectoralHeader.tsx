import { Shield, Wifi, WifiOff, Battery, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ElectoralHeaderProps {
  showStatus?: boolean;
}

export function ElectoralHeader({ showStatus = true }: ElectoralHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel] = useState(87); // Simulated

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="electoral-header px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="electoral-seal h-14 w-14">
            <Shield className="h-7 w-7 text-electoral-navy" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              National Electoral Commission
            </h1>
            <p className="text-sm text-muted-foreground">
              Secure Electronic Voting System
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        {showStatus && (
          <div className="flex items-center gap-6">
            {/* Air-Gap Status */}
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-success" />
              <span className="electoral-badge electoral-badge-secure">
                <span className="status-indicator online" />
                Air-Gapped
              </span>
            </div>

            {/* System Integrity */}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span className="electoral-badge electoral-badge-secure">
                Integrity Verified
              </span>
            </div>

            {/* Battery */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Battery className="h-4 w-4" />
              <span className="text-sm font-medium">{batteryLevel}%</span>
            </div>

            {/* Clock */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
