import { useState } from 'react';
import { CreateProjectWizardWithFallback } from '@/components/CreateProjectWizardWithFallback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  WifiOff,
  Wifi,
  Database,
  HardDrive,
  Cloud,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';

export default function CreateProjectFallbackDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [createdProjects, setCreatedProjects] = useState<any[]>([]);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Demo configuration
  const [config, setConfig] = useState({
    enableOfflineMode: true,
    enableAutoSave: true,
    enableMockData: true,
    simulateOffline: false,
    simulateError: false,
    simulateSlowNetwork: false,
  });

  // Simulate network conditions
  const handleOpenWithConditions = () => {
    if (config.simulateOffline) {
      // Temporarily override navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    }

    if (config.simulateSlowNetwork) {
      // This would be handled by the retry mechanism in the component
    }

    setIsOpen(true);
  };

  const handleSuccess = (project: any) => {
    setCreatedProjects([...createdProjects, {
      ...project,
      timestamp: new Date().toISOString(),
      source: project.id?.startsWith('offline-') ? 'offline' : 'online'
    }]);
    setLastError(null);
  };

  const handleError = (error: Error) => {
    setLastError(error);
  };

  const clearLocalStorage = () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('project_wizard_'))
      .forEach(key => localStorage.removeItem(key));
    alert('Local storage cleared!');
  };

  const getStorageInfo = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('project_wizard_'));
    const size = keys.reduce((acc, key) => {
      const item = localStorage.getItem(key);
      return acc + (item?.length || 0);
    }, 0);
    return { count: keys.length, size: (size / 1024).toFixed(2) };
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Create Project - Fallback Mechanism Demo</h1>
          <p className="text-gray-600 mt-2">
            Test the robust fallback mechanism for the Create Project wizard
          </p>
        </div>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure how the component behaves under different conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="offline-mode" className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  Enable Offline Mode
                </Label>
                <Switch
                  id="offline-mode"
                  checked={config.enableOfflineMode}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableOfflineMode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save" className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Enable Auto-Save
                </Label>
                <Switch
                  id="auto-save"
                  checked={config.enableAutoSave}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableAutoSave: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mock-data" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Enable Mock Data
                </Label>
                <Switch
                  id="mock-data"
                  checked={config.enableMockData}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableMockData: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="simulate-offline" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Simulate Offline
                </Label>
                <Switch
                  id="simulate-offline"
                  checked={config.simulateOffline}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, simulateOffline: checked })
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t flex gap-4">
              <Button onClick={handleOpenWithConditions} size="lg">
                Open Create Project Wizard
              </Button>
              <Button onClick={clearLocalStorage} variant="outline">
                Clear Local Storage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {navigator.onLine ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    Offline
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {navigator.onLine
                  ? "Connected to the internet"
                  : "Working in offline mode"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-500" />
                Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {storageInfo.count} items ({storageInfo.size} KB)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-500" />
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {createdProjects.filter(p => p.source === 'offline').length} pending sync
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Last Error:</strong> {lastError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Created Projects */}
        {createdProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Created Projects</CardTitle>
              <CardDescription>
                Projects created during this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {createdProjects.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{project.title || 'Untitled Project'}</div>
                      <div className="text-sm text-gray-500">
                        Created at {new Date(project.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant={project.source === 'offline' ? 'secondary' : 'default'}>
                      {project.source === 'offline' ? (
                        <>
                          <WifiOff className="w-3 h-3 mr-1" />
                          Offline
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Synced
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Fallback Mechanism Features</CardTitle>
            <CardDescription>
              Built-in resilience for a smooth user experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Offline Mode</div>
                    <div className="text-sm text-gray-600">
                      Continue working without internet connection
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Auto-Save Drafts</div>
                    <div className="text-sm text-gray-600">
                      Never lose progress with automatic draft saving
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Smart Caching</div>
                    <div className="text-sm text-gray-600">
                      Intelligent data caching with staleness detection
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Error Recovery</div>
                    <div className="text-sm text-gray-600">
                      Graceful error handling with retry mechanisms
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Mock Data Fallback</div>
                    <div className="text-sm text-gray-600">
                      Demo data when real data is unavailable
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Background Sync</div>
                    <div className="text-sm text-gray-600">
                      Automatic synchronization when connection returns
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Progressive Enhancement</div>
                    <div className="text-sm text-gray-600">
                      Enhanced features when conditions improve
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Error Boundaries</div>
                    <div className="text-sm text-gray-600">
                      Component isolation prevents cascade failures
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Testing Tips:</strong>
            <ul className="mt-2 ml-4 list-disc text-sm">
              <li>Toggle "Simulate Offline" to test offline behavior</li>
              <li>Clear local storage to test fresh state</li>
              <li>Open DevTools Network tab and set to "Offline" for real offline testing</li>
              <li>Check Application → Local Storage to see saved drafts</li>
              <li>The component auto-saves every 2 seconds of inactivity</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      {/* The Wizard Dialog */}
      <CreateProjectWizardWithFallback
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
        onError={handleError}
        fallbackConfig={{
          enableOfflineMode: config.enableOfflineMode,
          enableAutoSave: config.enableAutoSave,
          enableMockData: config.enableMockData,
          retryAttempts: 3,
          retryDelay: 1000,
          cacheTimeout: 5 * 60 * 1000,
        }}
      />
    </div>
  );
}