import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { authenticateAdmin } from '@/lib/database';

interface AdminLoginProps {
  onAuthenticated: () => void;
  onCancel: () => void;
}

export function AdminLogin({ onAuthenticated, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isValid = await authenticateAdmin(username, password);
      
      if (isValid) {
        onAuthenticated();
      } else {
        setError('Invalid administrator credentials');
      }
    } catch (err) {
      setError('Authentication system error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md animate-scale-in">
        <div className="electoral-card">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Administrator Access</h2>
            <p className="mt-2 text-muted-foreground">
              Authorized personnel only
            </p>
          </div>

          {/* Warning Banner */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning">Restricted Access</p>
              <p className="text-warning/80">
                This console is for system monitoring only. 
                Individual votes cannot be viewed.
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 animate-slide-up">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="username" 
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Administrator ID
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="secure-input"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="secure-input pr-12"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="warning"
                size="lg"
                className="flex-1 gap-2"
                disabled={!username || !password || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Authenticate
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Demo Hint */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Demo credentials: <code className="bg-secondary px-1 rounded">admin</code> / <code className="bg-secondary px-1 rounded">electoral2024</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
