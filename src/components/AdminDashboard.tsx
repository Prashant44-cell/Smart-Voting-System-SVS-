import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Database, 
  HardDrive, 
  Battery, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  LogOut,
  FileText,
  RefreshCw,
  Cpu,
  Hash,
  Link2
} from 'lucide-react';
import { validateChain, getVoteStatistics, exportChainForAudit, type BlockchainState } from '@/lib/blockchain';
import { shamirSplit, encodeShare, bufferToHex, generateRandomBytes } from '@/lib/crypto';

interface AdminDashboardProps {
  blockchainState: BlockchainState;
  onLogout: () => void;
}

export function AdminDashboard({ blockchainState, onLogout }: AdminDashboardProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error: string | null;
  } | null>(null);
  const [shamirShards, setShamirShards] = useState<string[] | null>(null);
  const [systemStats] = useState({
    cpuUsage: 23,
    memoryUsage: 45,
    diskUsage: 12,
    batteryLevel: 87,
    uptime: '4h 32m',
    temperature: 42
  });

  const stats = getVoteStatistics(blockchainState);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleValidateChain = async () => {
    setIsValidating(true);
    try {
      const result = await validateChain(blockchainState.chain);
      setValidationResult({ isValid: result.isValid, error: result.error });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportAudit = () => {
    const auditData = exportChainForAudit(blockchainState);
    const blob = new Blob([auditData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electoral-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateShards = () => {
    // Generate a demo RSA private key (simulated)
    const demoPrivateKey = generateRandomBytes(32);
    const shards = shamirSplit(demoPrivateKey, 5, 3);
    setShamirShards(shards.map(s => encodeShare(s)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="electoral-header px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
              <Lock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Administrator Console
              </h1>
              <p className="text-sm text-muted-foreground">
                System Monitoring • Read-Only Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {currentTime.toLocaleDateString()}
              </p>
              <p className="text-sm font-mono text-muted-foreground">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatCard
            icon={Database}
            label="Blockchain Blocks"
            value={stats.totalBlocks.toString()}
            status="normal"
          />
          <StatCard
            icon={Hash}
            label="Unique Voters"
            value={stats.uniqueVoters.toString()}
            status="normal"
          />
          <StatCard
            icon={Shield}
            label="Chain Integrity"
            value={stats.chainIntegrity ? 'Valid' : 'Invalid'}
            status={stats.chainIntegrity ? 'success' : 'error'}
          />
          <StatCard
            icon={Clock}
            label="Last Block"
            value={stats.lastBlockTime 
              ? new Date(stats.lastBlockTime).toLocaleTimeString() 
              : 'No votes'
            }
            status="normal"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Health */}
          <div className="electoral-card">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              System Health
            </h3>
            
            <div className="space-y-4">
              <HealthBar label="CPU Usage" value={systemStats.cpuUsage} />
              <HealthBar label="Memory" value={systemStats.memoryUsage} />
              <HealthBar label="Disk Space" value={systemStats.diskUsage} />
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <Battery className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-sm font-medium">{systemStats.batteryLevel}%</p>
                  <p className="text-xs text-muted-foreground">Battery</p>
                </div>
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium">{systemStats.uptime}</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <Cpu className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-sm font-medium">{systemStats.temperature}°C</p>
                  <p className="text-xs text-muted-foreground">Temp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="electoral-card">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Blockchain Integrity
            </h3>

            <div className="space-y-4">
              {/* Latest Block Info */}
              {blockchainState.chain.length > 1 && (
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Latest Block Hash
                  </p>
                  <p className="blockchain-hash text-xs">
                    {blockchainState.chain[blockchainState.chain.length - 1].hash}
                  </p>
                </div>
              )}

              {/* Validation Result */}
              {validationResult && (
                <div className={`flex items-center gap-3 rounded-lg p-4 ${
                  validationResult.isValid 
                    ? 'bg-success/10 border border-success/30' 
                    : 'bg-destructive/10 border border-destructive/30'
                }`}>
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium text-success">
                        Chain integrity verified - No tampering detected
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">
                        {validationResult.error}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="electoral-outline"
                  onClick={handleValidateChain}
                  disabled={isValidating}
                  className="flex-1 gap-2"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Validate Chain
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportAudit}
                  className="flex-1 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export Audit Log
                </Button>
              </div>
            </div>
          </div>

          {/* Shamir Key Shards */}
          <div className="electoral-card lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-warning" />
              Shamir Secret Sharing - Key Recovery
            </h3>

            <div className="mb-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-warning flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-warning">Quorum Required for Decryption</p>
                <p className="text-warning/80">
                  Vote results can only be decrypted when 3 of 5 key holders provide their shards.
                  This ensures no single administrator can access vote counts.
                </p>
              </div>
            </div>

            {!shamirShards ? (
              <Button
                variant="warning"
                onClick={handleGenerateShards}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                Generate Demo Key Shards (3-of-5)
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The following shards would be distributed to 5 separate key holders:
                </p>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {shamirShards.map((shard, i) => (
                    <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Key Holder {i + 1}
                      </p>
                      <p className="blockchain-hash text-xs truncate" title={shard}>
                        {shard}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <Shield className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Administrative Limitations</p>
            <p>
              This console provides system monitoring capabilities only. Vote contents are encrypted 
              and cannot be viewed. Decryption requires a quorum of key holders with Shamir shards.
              All administrative actions are logged for audit purposes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  status 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  status: 'normal' | 'success' | 'error' 
}) {
  return (
    <div className="electoral-card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
        status === 'success' ? 'bg-success/20 text-success' :
        status === 'error' ? 'bg-destructive/20 text-destructive' :
        'bg-primary/20 text-primary'
      }`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// Health Bar Component
function HealthBar({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val < 50) return 'bg-success';
    if (val < 80) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
