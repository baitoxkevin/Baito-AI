/**
 * Service Worker Registration and Management
 */

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false

  static getInstance(): ServiceWorkerManager {
    if (!this.instance) {
      this.instance = new ServiceWorkerManager()
    }
    return this.instance
  }

  /**
   * Register the service worker
   */
  async register(): Promise<void> {
    // Only register in production and if supported
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Workers not supported')
      return
    }

    // Skip in development unless explicitly enabled
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_SW !== 'true') {
      console.log('[SW] Skipping registration in development')
      return
    }

    try {
      // Wait for window load
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(void 0)
        } else {
          window.addEventListener('load', () => resolve(void 0))
        }
      })

      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      })

      console.log('[SW] Registered successfully')

      // Set up update detection
      this.setupUpdateDetection()

      // Check for updates immediately
      this.checkForUpdates()

      // Check for updates periodically (every hour)
      setInterval(() => this.checkForUpdates(), 3600000)

    } catch (error) {
      console.error('[SW] Registration failed:', error)
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.unregister()
      console.log('[SW] Unregistered successfully')
      this.registration = null
    } catch (error) {
      console.error('[SW] Failed to unregister:', error)
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
    } catch (error) {
      console.error('[SW] Update check failed:', error)
    }
  }

  /**
   * Set up update detection
   */
  private setupUpdateDetection(): void {
    if (!this.registration) return

    // Listen for new service worker waiting
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing

      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          this.updateAvailable = true
          this.notifyUpdateAvailable()
        }
      })
    })

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page when a new service worker takes control
      window.location.reload()
    })
  }

  /**
   * Notify user about available update
   */
  private notifyUpdateAvailable(): void {
    // You can customize this to use your toast/notification system
    const shouldUpdate = confirm(
      'A new version of Baito-AI is available. Would you like to update now?'
    )

    if (shouldUpdate) {
      this.applyUpdate()
    }
  }

  /**
   * Apply the waiting service worker update
   */
  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return

    // Tell the waiting service worker to activate
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  /**
   * Get registration status
   */
  getStatus(): {
    registered: boolean
    updateAvailable: boolean
    scope?: string
  } {
    return {
      registered: !!this.registration,
      updateAvailable: this.updateAvailable,
      scope: this.registration?.scope
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[SW] Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  /**
   * Send a notification
   */
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      console.error('[SW] No service worker registration')
      return
    }

    const permission = await this.requestNotificationPermission()

    if (permission !== 'granted') {
      console.log('[SW] Notification permission not granted')
      return
    }

    try {
      await this.registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      })
    } catch (error) {
      console.error('[SW] Failed to show notification:', error)
    }
  }

  /**
   * Enable background sync
   */
  async enableBackgroundSync(tag: string): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      console.log('[SW] Background sync not supported')
      return
    }

    try {
      await (this.registration as any).sync.register(tag)
      console.log(`[SW] Background sync registered: ${tag}`)
    } catch (error) {
      console.error('[SW] Failed to register background sync:', error)
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance()

// Auto-register on module import
if (typeof window !== 'undefined') {
  serviceWorkerManager.register().catch(console.error)
}