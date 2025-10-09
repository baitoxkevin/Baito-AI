/**
 * Auth Debug Logger
 * Comprehensive logging to diagnose auth issues
 */

export class AuthDebugger {
    private static logs: string[] = [];

    static log(source: string, message: string, data?: any) {
        const timestamp = new Date().toISOString().split('T')[1];
        const logMessage = `[${timestamp}] [${source}] ${message}`;

        console.log(logMessage, data || '');
        this.logs.push(logMessage + (data ? ` ${JSON.stringify(data)}` : ''));
    }

    static getLogs(): string[] {
        return this.logs;
    }

    static downloadLogs() {
        const logContent = this.logs.join('\n');
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auth-debug-${Date.now()}.txt`;
        a.click();
    }

    static clear() {
        this.logs = [];
    }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).authDebug = AuthDebugger;
}
