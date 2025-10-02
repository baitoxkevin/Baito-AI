/**
 * Database Backup Service for Supabase
 * Handles automated backups, restoration, and monitoring
 */

import { supabase } from './supabase'

interface BackupConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retentionDays: number
  tables: string[]
  storage: 'supabase' | 'external'
}

interface BackupMetadata {
  id: string
  timestamp: string
  size: number
  tables: string[]
  status: 'pending' | 'completed' | 'failed'
  checksumHash?: string
}

export class BackupService {
  private config: BackupConfig
  private isRunning = false

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      enabled: true,
      frequency: 'daily',
      retentionDays: 30,
      tables: [
        'users',
        'projects',
        'project_staff',
        'candidates',
        'companies',
        'expense_claims',
        'receipts',
        'project_documents',
        'tasks',
        'activity_logs'
      ],
      storage: 'supabase',
      ...config
    }
  }

  /**
   * Initialize backup service
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[Backup] Service disabled')
      return
    }

    try {
      // Ensure backup metadata table exists
      await this.ensureBackupTable()

      // Clean up old backups
      await this.cleanupOldBackups()

      // Schedule next backup
      this.scheduleNextBackup()

      console.log('[Backup] Service initialized successfully')
    } catch (error) {
      console.error('[Backup] Failed to initialize:', error)
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<BackupMetadata> {
    if (this.isRunning) {
      throw new Error('Backup already in progress')
    }

    this.isRunning = true
    const backupId = `backup_${Date.now()}`

    try {
      console.log(`[Backup] Starting backup: ${backupId}`)

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        size: 0,
        tables: this.config.tables,
        status: 'pending'
      }

      // Record backup start
      await this.recordBackupMetadata(metadata)

      // Export data from each table
      const backupData: Record<string, any[]> = {}
      let totalSize = 0

      for (const table of this.config.tables) {
        try {
          const data = await this.exportTable(table)
          backupData[table] = data
          totalSize += JSON.stringify(data).length

          console.log(`[Backup] Exported ${table}: ${data.length} records`)
        } catch (error) {
          console.error(`[Backup] Failed to export ${table}:`, error)
          // Continue with other tables
        }
      }

      // Create backup file
      const backupContent = JSON.stringify({
        metadata: {
          ...metadata,
          size: totalSize,
          version: '1.0',
          tables: Object.keys(backupData)
        },
        data: backupData
      }, null, 2)

      // Calculate checksum
      const checksumHash = await this.calculateChecksum(backupContent)

      // Store backup
      await this.storeBackup(backupId, backupContent)

      // Update metadata
      const finalMetadata: BackupMetadata = {
        ...metadata,
        size: totalSize,
        status: 'completed',
        checksumHash
      }

      await this.updateBackupMetadata(backupId, finalMetadata)

      console.log(`[Backup] Completed successfully: ${backupId}`)
      return finalMetadata

    } catch (error) {
      console.error(`[Backup] Failed: ${backupId}`, error)

      // Update metadata with failure
      await this.updateBackupMetadata(backupId, {
        id: backupId,
        timestamp: new Date().toISOString(),
        size: 0,
        tables: this.config.tables,
        status: 'failed'
      })

      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Export data from a specific table
   */
  private async exportTable(tableName: string): Promise<any[]> {
    const batchSize = 1000
    let allData: any[] = []
    let offset = 0

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + batchSize - 1)

      if (error) {
        throw new Error(`Failed to export ${tableName}: ${error.message}`)
      }

      if (!data || data.length === 0) {
        break
      }

      allData = allData.concat(data)
      offset += batchSize

      // Prevent infinite loops
      if (data.length < batchSize) {
        break
      }
    }

    return allData
  }

  /**
   * Store backup in Supabase Storage
   */
  private async storeBackup(backupId: string, content: string): Promise<void> {
    const fileName = `${backupId}.json`

    const { error } = await supabase.storage
      .from('database-backups')
      .upload(fileName, new Blob([content], { type: 'application/json' }))

    if (error) {
      throw new Error(`Failed to store backup: ${error.message}`)
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const { data, error } = await supabase
      .from('backup_metadata')
      .select('*')
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[Backup] Failed to list backups:', error)
      return []
    }

    return data || []
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      console.log(`[Backup] Starting restoration from: ${backupId}`)

      // Download backup file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('database-backups')
        .download(`${backupId}.json`)

      if (downloadError) {
        throw new Error(`Failed to download backup: ${downloadError.message}`)
      }

      // Parse backup content
      const content = await fileData.text()
      const backup = JSON.parse(content)

      // Verify checksum
      const calculatedHash = await this.calculateChecksum(content)
      if (backup.metadata.checksumHash && backup.metadata.checksumHash !== calculatedHash) {
        throw new Error('Backup file corrupted - checksum mismatch')
      }

      // Restore each table
      for (const [tableName, tableData] of Object.entries(backup.data)) {
        await this.restoreTable(tableName, tableData as any[])
        console.log(`[Backup] Restored ${tableName}: ${(tableData as any[]).length} records`)
      }

      console.log(`[Backup] Restoration completed: ${backupId}`)

    } catch (error) {
      console.error(`[Backup] Restoration failed: ${backupId}`, error)
      throw error
    }
  }

  /**
   * Restore data to a specific table
   */
  private async restoreTable(tableName: string, data: any[]): Promise<void> {
    if (!data || data.length === 0) return

    // Clear existing data (be careful!)
    // await supabase.from(tableName).delete().neq('id', '')

    // Insert in batches
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)

      const { error } = await supabase
        .from(tableName)
        .upsert(batch)

      if (error) {
        throw new Error(`Failed to restore ${tableName}: ${error.message}`)
      }
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

    try {
      // Get old backup metadata
      const { data: oldBackups, error } = await supabase
        .from('backup_metadata')
        .select('id')
        .lt('timestamp', cutoffDate.toISOString())

      if (error || !oldBackups) return

      // Delete files and metadata
      for (const backup of oldBackups) {
        await supabase.storage
          .from('database-backups')
          .remove([`${backup.id}.json`])

        await supabase
          .from('backup_metadata')
          .delete()
          .eq('id', backup.id)
      }

      if (oldBackups.length > 0) {
        console.log(`[Backup] Cleaned up ${oldBackups.length} old backups`)
      }

    } catch (error) {
      console.error('[Backup] Cleanup failed:', error)
    }
  }

  /**
   * Schedule next backup based on frequency
   */
  private scheduleNextBackup(): void {
    if (!this.config.enabled) return

    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    }

    const interval = intervals[this.config.frequency]

    setTimeout(async () => {
      try {
        await this.createBackup()
      } catch (error) {
        console.error('[Backup] Scheduled backup failed:', error)
      }

      // Schedule next backup
      this.scheduleNextBackup()
    }, interval)
  }

  /**
   * Ensure backup metadata table exists
   */
  private async ensureBackupTable(): Promise<void> {
    // This would ideally be done via migration
    // For now, just check if we can access it
    const { error } = await supabase
      .from('backup_metadata')
      .select('id')
      .limit(1)

    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.warn('[Backup] backup_metadata table does not exist. Please create it via migration.')
    }
  }

  /**
   * Record backup metadata
   */
  private async recordBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const { error } = await supabase
      .from('backup_metadata')
      .insert(metadata)

    if (error) {
      console.error('[Backup] Failed to record metadata:', error)
    }
  }

  /**
   * Update backup metadata
   */
  private async updateBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    const { error } = await supabase
      .from('backup_metadata')
      .update(metadata)
      .eq('id', backupId)

    if (error) {
      console.error('[Backup] Failed to update metadata:', error)
    }
  }

  /**
   * Calculate checksum for backup integrity
   */
  private async calculateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Get backup service status
   */
  getStatus(): {
    enabled: boolean
    frequency: string
    retentionDays: number
    isRunning: boolean
    lastBackup?: string
  } {
    return {
      enabled: this.config.enabled,
      frequency: this.config.frequency,
      retentionDays: this.config.retentionDays,
      isRunning: this.isRunning
    }
  }
}

// Export singleton instance
export const backupService = new BackupService({
  enabled: import.meta.env.VITE_ENABLE_BACKUPS === 'true',
  frequency: (import.meta.env.VITE_BACKUP_FREQUENCY as any) || 'daily',
  retentionDays: parseInt(import.meta.env.VITE_BACKUP_RETENTION_DAYS || '30')
})

// Auto-initialize
if (typeof window !== 'undefined') {
  backupService.initialize().catch(console.error)
}