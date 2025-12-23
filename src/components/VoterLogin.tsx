import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, Eye, EyeOff, HelpCircle, Fingerprint } from 'lucide-react';
import { authenticateVoter, getConstituency, getVoterHash, getDemoCredentials } from '@/lib/database';
import type { VoterRecord, Constituency } from '@/lib/database';

interface VoterLoginProps {
  onAuthenticated: (voter: VoterRecord, constituency: Constituency, voterHash: string) => void;
  onHelpRequest: () => void;
}

export function VoterLogin({ onAuthenticated, onHelpRequest }: VoterLoginProps) {
  const [nationalId, setNationalId] = useState('9763558020A');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await authenticateVoter(nationalId, pin);

      if (result.success && result.voter) {
        const constituency = await getConstituency(result.voter.constituency);
        const voterHash = await getVoterHash(nationalId);
        
        if (constituency) {
          onAuthenticated(result.voter, constituency, voterHash);
        } else {
          setError('Constituency data unavailable. Please contact a polling officer.');
        }
      } else {
        setError(result.error || 'Authentication failed');
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
      }
    } catch (err) {
      setError('System error. Please try again or contact a polling officer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (id: string, demoPin: string) => {
    setNationalId(id);
    setPin(demoPin);
    setShowDemo(false);
  };

  // Focus PIN field when ID is filled
  useEffect(() => {
    if (nationalId.length >= 10 && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [nationalId]);

  return (
    <div className="flex min-h-[calc(100vh-88px)] items-center justify-center p-8">
      <div className="w-full max-w-lg animate-scale-in">
        {/* Login Card */}
        <div className="electoral-card">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Voter Authentication</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your National ID and PIN to access your ballot
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 animate-slide-up">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">{error}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="mt-1 text-sm text-destructive/80">
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* National ID Field */}
            <div>
              <label 
                htmlFor="nationalId" 
                className="mb-2 block text-sm font-medium text-foreground"
              >
                National ID Number
              </label>
              <input
                id="nationalId"
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.toUpperCase())}
                placeholder="e.g., A123456789"
                className="secure-input uppercase"
                maxLength={12}
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* PIN Field */}
            <div>
              <label 
                htmlFor="pin" 
                className="mb-2 block text-sm font-medium text-foreground"
              >
                4-Digit PIN
              </label>
              <div className="relative">
                <input
                  ref={pinInputRef}
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="secure-input pr-12"
                  maxLength={4}
                  autoComplete="off"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* PIN Dots Visual */}
              <div className="mt-3 pin-dots justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="electoral"
              size="xl"
              className="w-full"
              disabled={nationalId.length < 3 || pin.length !== 4 || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Authenticate
                </>
              )}
            </Button>
          </form>

          {/* Help Link */}
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-border pt-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onHelpRequest}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Need Assistance?
            </Button>
          </div>
        </div>

        {/* Demo Credentials (Development Only) */}
        <div className="mt-6">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="mx-auto block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDemo ? 'Hide' : 'Show'} Demo Credentials
          </button>
          
          {showDemo && (
            <div className="mt-4 rounded-lg border border-border bg-card p-4 animate-slide-up">
              <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Demo Accounts (Click to use)
              </p>
              <div className="space-y-2">
                {getDemoCredentials().map((cred, i) => (
                  <button
                    key={i}
                    onClick={() => handleDemoLogin(cred.nationalId, cred.pin)}
                    className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-secondary transition-colors"
                  >
                    <span className="font-mono">{cred.nationalId}</span>
                    <span className="text-muted-foreground">PIN: {cred.pin}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
