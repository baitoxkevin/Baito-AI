# Production Monitoring Setup Guide

## Overview
This guide covers the setup of comprehensive monitoring for the Baito-AI application in production, including error tracking, performance monitoring, uptime monitoring, and log aggregation.

## Error Tracking

### Option 1: Sentry (Recommended)

#### Setup Instructions
1. **Create Sentry Account:**
   - Go to [sentry.io](https://sentry.io) and create an account
   - Create a new project for "React"

2. **Install Sentry SDK:**
   ```bash
   npm install @sentry/react @sentry/integrations
   ```

3. **Configure Sentry (add to src/main.tsx):**
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: import.meta.env.MODE,
     integrations: [
       new Sentry.BrowserTracing(),
       new Sentry.Replay(),
     ],
     tracesSampleRate: 1.0,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   ```

4. **Add Environment Variable:**
   ```bash
   VITE_SENTRY_DSN=your_sentry_dsn_here
   ```

#### Error Boundary Integration
```typescript
// Wrap your app with Sentry error boundary
import { ErrorBoundary } from "@sentry/react";

<ErrorBoundary fallback={ErrorFallback} showDialog>
  <App />
</ErrorBoundary>
```

### Option 2: LogRocket

#### Setup Instructions
1. **Create LogRocket Account:**
   - Go to [logrocket.com](https://logrocket.com)
   - Create a new application

2. **Install LogRocket:**
   ```bash
   npm install logrocket logrocket-react
   ```

3. **Configure LogRocket:**
   ```typescript
   import LogRocket from 'logrocket';
   import setupLogRocketReact from 'logrocket-react';

   LogRocket.init('your-app-id');
   setupLogRocketReact(LogRocket);
   ```

## Performance Monitoring

### Web Vitals Tracking

#### Implementation
1. **Install web-vitals:**
   ```bash
   npm install web-vitals
   ```

2. **Create performance tracking utility:**
   ```typescript
   // src/lib/performance-monitor.ts
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

   function sendToAnalytics(metric: any) {
     // Send to your analytics service
     console.log(metric);

     // Example: Send to Google Analytics
     if (typeof gtag !== 'undefined') {
       gtag('event', metric.name, {
         event_category: 'Web Vitals',
         value: Math.round(metric.value),
         event_label: metric.id,
         non_interaction: true,
       });
     }
   }

   export function initPerformanceMonitoring() {
     getCLS(sendToAnalytics);
     getFID(sendToAnalytics);
     getFCP(sendToAnalytics);
     getLCP(sendToAnalytics);
     getTTFB(sendToAnalytics);
   }
   ```

3. **Initialize in main.tsx:**
   ```typescript
   import { initPerformanceMonitoring } from './lib/performance-monitor';

   initPerformanceMonitoring();
   ```

### Lighthouse CI

#### GitHub Actions Integration
```yaml
# Add to .github/workflows/deploy.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    configPath: './lighthouserc.json'
    uploadArtifacts: true
    temporaryPublicStorage: true
```

#### Configuration (lighthouserc.json)
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173"],
      "startServerCommand": "npm run preview",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["warn", {"minScore": 0.8}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Uptime Monitoring

### Option 1: UptimeRobot (Free)

#### Setup Instructions
1. **Create Account:**
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Create a free account

2. **Add Monitor:**
   - Monitor Type: HTTP(s)
   - URL: Your production URL
   - Monitoring Interval: 5 minutes
   - Timeout: 30 seconds

3. **Configure Alerts:**
   - Email notifications
   - Slack/Discord webhooks (optional)
   - SMS alerts (paid feature)

### Option 2: Pingdom

#### Setup Instructions
1. **Create Account:**
   - Go to [pingdom.com](https://pingdom.com)
   - Start free trial

2. **Create Uptime Check:**
   - Check Type: HTTP
   - URL: Your production domain
   - Check Interval: 1 minute
   - Request Timeout: 30 seconds

3. **Set Up Alerts:**
   - Email notifications
   - Multiple notification channels
   - Custom alert policies

### Option 3: StatusCake

#### Setup Instructions
1. **Create Account:**
   - Go to [statuscake.com](https://statuscake.com)
   - Free tier available

2. **Add Website Monitor:**
   - Test Type: HTTP
   - Website URL: Your production URL
   - Check Rate: 5 minutes
   - Timeout: 40 seconds

## Analytics and User Behavior

### Google Analytics 4

#### Setup Instructions
1. **Create GA4 Property:**
   - Go to [analytics.google.com](https://analytics.google.com)
   - Create new property
   - Get Measurement ID

2. **Install GA4:**
   ```bash
   npm install gtag
   ```

3. **Configure GA4:**
   ```typescript
   // src/lib/analytics.ts
   export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

   declare global {
     interface Window {
       gtag: (...args: any[]) => void;
     }
   }

   export const trackPageView = (url: string) => {
     if (typeof window.gtag !== 'undefined') {
       window.gtag('config', GA_MEASUREMENT_ID, {
         page_path: url,
       });
     }
   };

   export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
     if (typeof window.gtag !== 'undefined') {
       window.gtag('event', action, {
         event_category: category,
         event_label: label,
         value: value,
       });
     }
   };
   ```

4. **Add to index.html:**
   ```html
   <!-- Google tag (gtag.js) -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

### Privacy-Focused Analytics (Alternative)

#### Plausible Analytics
1. **Setup:**
   - Go to [plausible.io](https://plausible.io)
   - Add your domain
   - Get tracking script

2. **Integration:**
   ```html
   <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
   ```

## Application Performance Monitoring (APM)

### Custom Performance Tracking

#### Create Performance Service
```typescript
// src/lib/performance-service.ts
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];

  trackPageLoad(startTime: number) {
    const loadTime = performance.now() - startTime;
    this.recordMetric('page_load', loadTime);
  }

  trackApiCall(endpoint: string, duration: number) {
    this.recordMetric(`api_${endpoint}`, duration);
  }

  trackUserAction(action: string, duration: number) {
    this.recordMetric(`user_${action}`, duration);
  }

  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(metric);
    this.sendMetric(metric);
  }

  private sendMetric(metric: PerformanceMetric) {
    // Send to your analytics service
    if (import.meta.env.PROD) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(console.error);
    }
  }
}

export const performanceService = new PerformanceService();
```

## Log Aggregation

### Browser Console Logs

#### Custom Logger Service
```typescript
// src/lib/logger-service.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  url: string;
  stack?: string;
  metadata?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  debug(message: string, metadata?: any) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: any) {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: any) {
    this.log(LogLevel.ERROR, message, {
      ...metadata,
      stack: error?.stack,
      errorMessage: error?.message,
    });
  }

  private log(level: LogLevel, message: string, metadata?: any) {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      url: window.location.href,
      metadata,
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Send critical logs immediately
    if (level >= LogLevel.ERROR) {
      this.sendLogs([logEntry]);
    }

    // Console output for development
    if (import.meta.env.DEV) {
      const logMethod = [console.debug, console.info, console.warn, console.error][level];
      logMethod(message, metadata);
    }
  }

  private sendLogs(logs: LogEntry[]) {
    if (import.meta.env.PROD) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      }).catch(console.error);
    }
  }

  flushLogs() {
    if (this.logs.length > 0) {
      this.sendLogs(this.logs);
      this.logs = [];
    }
  }
}

export const logger = new LoggerService();

// Flush logs when user leaves the page
window.addEventListener('beforeunload', () => {
  logger.flushLogs();
});
```

## Alerting Configuration

### Discord/Slack Webhooks

#### Discord Webhook Setup
```typescript
// src/lib/alert-service.ts
const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

export async function sendDiscordAlert(
  title: string,
  description: string,
  severity: 'info' | 'warning' | 'error' = 'info'
) {
  if (!DISCORD_WEBHOOK_URL || import.meta.env.DEV) return;

  const colors = {
    info: 0x3498db,
    warning: 0xf39c12,
    error: 0xe74c3c,
  };

  const payload = {
    embeds: [{
      title,
      description,
      color: colors[severity],
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Environment',
          value: import.meta.env.MODE,
          inline: true,
        },
        {
          name: 'URL',
          value: window.location.href,
          inline: true,
        },
      ],
    }],
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send Discord alert:', error);
  }
}
```

## Monitoring Dashboard

### Custom Monitoring Dashboard

#### Create a simple monitoring page
```typescript
// src/pages/MonitoringPage.tsx
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger-service';
import { performanceService } from '@/lib/performance-service';

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState({
    uptime: 0,
    errors: 0,
    performance: 0,
    lastDeployment: '',
  });

  useEffect(() => {
    // Fetch monitoring data
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      // Replace with your actual monitoring API
      const response = await fetch('/api/monitoring');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      logger.error('Failed to fetch monitoring data', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Production Monitoring</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-green-600">Uptime</h3>
          <p className="text-2xl font-bold">{metrics.uptime}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-red-600">Errors (24h)</h3>
          <p className="text-2xl font-bold">{metrics.errors}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-blue-600">Performance</h3>
          <p className="text-2xl font-bold">{metrics.performance}ms</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-600">Last Deploy</h3>
          <p className="text-sm">{metrics.lastDeployment}</p>
        </div>
      </div>
    </div>
  );
}
```

## Environment Variables for Monitoring

Add these to your production environment:

```bash
# Error Tracking
VITE_SENTRY_DSN=your_sentry_dsn
VITE_LOGROCKET_APP_ID=your_logrocket_id

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_PLAUSIBLE_DOMAIN=yourdomain.com

# Alerting
VITE_DISCORD_WEBHOOK_URL=your_discord_webhook
VITE_SLACK_WEBHOOK_URL=your_slack_webhook

# Performance Monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_MONITORING_API_URL=your_monitoring_api
```

## Quick Setup Checklist

- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Configure uptime monitoring (UptimeRobot/Pingdom)
- [ ] Implement performance tracking (Web Vitals)
- [ ] Set up analytics (GA4/Plausible)
- [ ] Configure alerting (Discord/Slack)
- [ ] Add environment variables
- [ ] Test all monitoring systems
- [ ] Create monitoring dashboard access

## Maintenance Tasks

### Weekly
- Review error reports and trends
- Check uptime statistics
- Analyze performance metrics
- Update monitoring thresholds if needed

### Monthly
- Review and optimize monitoring costs
- Update monitoring dependencies
- Test alert systems
- Review and cleanup old logs

### Quarterly
- Comprehensive monitoring system review
- Update monitoring strategy
- Review and optimize performance thresholds
- Audit monitoring data retention policies

---

**Note:** This monitoring setup provides comprehensive coverage for production applications. Start with the essential monitoring (error tracking and uptime) and gradually add more sophisticated monitoring as your application grows.