import { WorkingMemory, WorkingMemoryEntry } from './working-memory';
import { EpisodicMemory, EpisodicMemoryEntry } from './episodic-memory';
import { SemanticMemory, SemanticConcept, SemanticRelation } from './semantic-memory';

export interface MemorySnapshot {
  timestamp: number;
  version: string;
  workingMemory: {
    entries: WorkingMemoryEntry[];
    stats: any;
  };
  episodicMemory: {
    episodes: EpisodicMemoryEntry[];
    stats: any;
  };
  semanticMemory: {
    concepts: SemanticConcept[];
    relations: SemanticRelation[];
    stats: any;
  };
  metadata: {
    totalSize: number;
    compressionRatio: number;
    checksum: string;
  };
}

export interface PersistenceConfig {
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
  maxSnapshots: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupEnabled: boolean;
  storageLocation: string;
}

export interface PersistenceStats {
  totalSnapshots: number;
  lastSaveTime: number;
  lastLoadTime: number;
  totalSaves: number;
  totalLoads: number;
  averageSaveTime: number;
  averageLoadTime: number;
  storageUsed: number;
  compressionRatio: number;
  errorCount: number;
  lastError?: string;
}

export class MemoryPersistence {
  private workingMemory: WorkingMemory;
  private episodicMemory: EpisodicMemory;
  private semanticMemory: SemanticMemory;
  private config: PersistenceConfig;
  private stats: PersistenceStats;
  private autoSaveTimer?: NodeJS.Timeout;
  private snapshots: Map<string, MemorySnapshot> = new Map();
  private isInitialized = false;

  constructor(
    workingMemory: WorkingMemory,
    episodicMemory: EpisodicMemory,
    semanticMemory: SemanticMemory,
    config: Partial<PersistenceConfig> = {}
  ) {
    this.workingMemory = workingMemory;
    this.episodicMemory = episodicMemory;
    this.semanticMemory = semanticMemory;
    
    this.config = {
      autoSave: true,
      autoSaveInterval: 300000, // 5 minutes
      maxSnapshots: 10,
      compressionEnabled: true,
      encryptionEnabled: false,
      backupEnabled: true,
      storageLocation: './memory-snapshots',
      ...config
    };

    this.stats = {
      totalSnapshots: 0,
      lastSaveTime: 0,
      lastLoadTime: 0,
      totalSaves: 0,
      totalLoads: 0,
      averageSaveTime: 0,
      averageLoadTime: 0,
      storageUsed: 0,
      compressionRatio: 1.0,
      errorCount: 0
    };
  }

  /**
   * Initialize persistence system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create storage directory if it doesn't exist
      await this.ensureStorageDirectory();

      // Load existing snapshots
      await this.loadSnapshotIndex();

      // Start auto-save if enabled
      if (this.config.autoSave) {
        this.startAutoSave();
      }

      this.isInitialized = true;
    } catch (error) {
      this.handleError('Failed to initialize persistence', error);
      throw error;
    }
  }

  /**
   * Create memory snapshot
   */
  async createSnapshot(name?: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      const snapshotId = name || `snapshot_${Date.now()}`;
      
      // Collect memory data
      const workingMemoryData = this.extractWorkingMemoryData();
      const episodicMemoryData = this.extractEpisodicMemoryData();
      const semanticMemoryData = this.extractSemanticMemoryData();

      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        version: '1.0.0',
        workingMemory: workingMemoryData,
        episodicMemory: episodicMemoryData,
        semanticMemory: semanticMemoryData,
        metadata: {
          totalSize: 0,
          compressionRatio: 1.0,
          checksum: ''
        }
      };

      // Calculate metadata
      const serializedData = JSON.stringify(snapshot);
      snapshot.metadata.totalSize = serializedData.length;
      snapshot.metadata.checksum = this.calculateChecksum(serializedData);

      // Apply compression if enabled
      if (this.config.compressionEnabled) {
        const compressedSnapshot = await this.compressSnapshot(snapshot);
        snapshot.metadata.compressionRatio = serializedData.length / JSON.stringify(compressedSnapshot).length;
      }

      // Store snapshot
      this.snapshots.set(snapshotId, snapshot);

      // Maintain snapshot limit
      if (this.snapshots.size > this.config.maxSnapshots) {
        await this.cleanupOldSnapshots();
      }

      // Save to persistent storage
      await this.saveSnapshotToDisk(snapshotId, snapshot);

      // Update stats
      const saveTime = Date.now() - startTime;
      this.updateSaveStats(saveTime);

      return snapshotId;
    } catch (error) {
      this.handleError('Failed to create snapshot', error);
      throw error;
    }
  }

  /**
   * Load memory snapshot
   */
  async loadSnapshot(snapshotId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      let snapshot = this.snapshots.get(snapshotId);
      
             if (!snapshot) {
         const loadedSnapshot = await this.loadSnapshotFromDisk(snapshotId);
         if (!loadedSnapshot) {
           throw new Error(`Snapshot ${snapshotId} not found`);
         }
         snapshot = loadedSnapshot;
       }

      // Verify snapshot integrity
      await this.verifySnapshotIntegrity(snapshot);

      // Restore memory systems
      await this.restoreWorkingMemory(snapshot.workingMemory);
      await this.restoreEpisodicMemory(snapshot.episodicMemory);
      await this.restoreSemanticMemory(snapshot.semanticMemory);

      // Update stats
      const loadTime = Date.now() - startTime;
      this.updateLoadStats(loadTime);

    } catch (error) {
      this.handleError('Failed to load snapshot', error);
      throw error;
    }
  }

  /**
   * List available snapshots
   */
  listSnapshots(): Array<{
    id: string;
    timestamp: number;
    size: number;
    version: string;
  }> {
    return Array.from(this.snapshots.entries()).map(([id, snapshot]) => ({
      id,
      timestamp: snapshot.timestamp,
      size: snapshot.metadata.totalSize,
      version: snapshot.version
    }));
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      this.snapshots.delete(snapshotId);
      await this.deleteSnapshotFromDisk(snapshotId);
    } catch (error) {
      this.handleError('Failed to delete snapshot', error);
      throw error;
    }
  }

  /**
   * Export memory data
   */
  async exportMemoryData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const snapshot = await this.createSnapshot('export_temp');
      const snapshotData = this.snapshots.get(snapshot);
      
      if (!snapshotData) {
        throw new Error('Failed to create export snapshot');
      }

      let exportData: string;
      
      if (format === 'json') {
        exportData = JSON.stringify(snapshotData, null, 2);
      } else {
        exportData = await this.convertToCSV(snapshotData);
      }

      // Clean up temporary snapshot
      await this.deleteSnapshot(snapshot);

      return exportData;
    } catch (error) {
      this.handleError('Failed to export memory data', error);
      throw error;
    }
  }

  /**
   * Import memory data
   */
  async importMemoryData(data: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      let snapshot: MemorySnapshot;
      
      if (format === 'json') {
        snapshot = JSON.parse(data);
      } else {
        snapshot = await this.convertFromCSV(data);
      }

      // Verify imported data
      await this.verifySnapshotIntegrity(snapshot);

      // Create snapshot from imported data
      const snapshotId = `imported_${Date.now()}`;
      this.snapshots.set(snapshotId, snapshot);

      // Load the imported snapshot
      await this.loadSnapshot(snapshotId);

    } catch (error) {
      this.handleError('Failed to import memory data', error);
      throw error;
    }
  }

  /**
   * Get persistence statistics
   */
  getStats(): PersistenceStats {
    return { ...this.stats };
  }

  /**
   * Backup memory data
   */
  async createBackup(): Promise<string> {
    try {
      const backupId = `backup_${Date.now()}`;
      const snapshot = await this.createSnapshot(backupId);
      
      if (this.config.backupEnabled) {
        await this.saveBackupToDisk(backupId, this.snapshots.get(snapshot)!);
      }

      return backupId;
    } catch (error) {
      this.handleError('Failed to create backup', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.loadBackupFromDisk(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      await this.loadSnapshot(backupId);
    } catch (error) {
      this.handleError('Failed to restore from backup', error);
      throw error;
    }
  }

  /**
   * Cleanup old snapshots and backups
   */
  async cleanup(): Promise<void> {
    try {
      await this.cleanupOldSnapshots();
      await this.cleanupOldBackups();
    } catch (error) {
      this.handleError('Failed to cleanup', error);
      throw error;
    }
  }

  /**
   * Shutdown persistence system
   */
  async shutdown(): Promise<void> {
    try {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }

      if (this.config.autoSave) {
        await this.createSnapshot('shutdown_auto');
      }

      this.isInitialized = false;
    } catch (error) {
      this.handleError('Failed to shutdown persistence', error);
    }
  }

  /**
   * Private helper methods
   */
  private extractWorkingMemoryData(): MemorySnapshot['workingMemory'] {
    // In a real implementation, this would extract data from WorkingMemory
    // For now, we'll return a placeholder structure
    return {
      entries: [], // Would be populated from workingMemory.getAllEntries()
      stats: this.workingMemory.getStats()
    };
  }

  private extractEpisodicMemoryData(): MemorySnapshot['episodicMemory'] {
    // In a real implementation, this would extract data from EpisodicMemory
    return {
      episodes: [], // Would be populated from episodicMemory.getAllEpisodes()
      stats: this.episodicMemory.getStats()
    };
  }

  private extractSemanticMemoryData(): MemorySnapshot['semanticMemory'] {
    // In a real implementation, this would extract data from SemanticMemory
    return {
      concepts: [], // Would be populated from semanticMemory.getAllConcepts()
      relations: [], // Would be populated from semanticMemory.getAllRelations()
      stats: this.semanticMemory.getStats()
    };
  }

  private async restoreWorkingMemory(data: MemorySnapshot['workingMemory']): Promise<void> {
    // Clear existing data
    this.workingMemory.clear();
    
    // Restore entries
    // In a real implementation, this would restore entries to WorkingMemory
    // For now, it's a placeholder
  }

  private async restoreEpisodicMemory(data: MemorySnapshot['episodicMemory']): Promise<void> {
    // Clear existing data
    this.episodicMemory.clear();
    
    // Restore episodes
    // In a real implementation, this would restore episodes to EpisodicMemory
  }

  private async restoreSemanticMemory(data: MemorySnapshot['semanticMemory']): Promise<void> {
    // Clear existing data
    this.semanticMemory.clear();
    
    // Restore concepts and relations
    // In a real implementation, this would restore data to SemanticMemory
  }

  private calculateChecksum(data: string): string {
    // Simple checksum calculation
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async compressSnapshot(snapshot: MemorySnapshot): Promise<MemorySnapshot> {
    // Placeholder for compression logic
    // In a real implementation, this would use a compression library
    return snapshot;
  }

  private async verifySnapshotIntegrity(snapshot: MemorySnapshot): Promise<void> {
    const serializedData = JSON.stringify({
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        checksum: ''
      }
    });
    
    const calculatedChecksum = this.calculateChecksum(serializedData);
    
    if (calculatedChecksum !== snapshot.metadata.checksum) {
      throw new Error('Snapshot integrity check failed');
    }
  }

  private async ensureStorageDirectory(): Promise<void> {
    // Placeholder for directory creation
    // In a real implementation, this would create the storage directory
  }

  private async loadSnapshotIndex(): Promise<void> {
    // Placeholder for loading snapshot index from disk
    // In a real implementation, this would load existing snapshots
  }

  private async saveSnapshotToDisk(id: string, snapshot: MemorySnapshot): Promise<void> {
    // Placeholder for saving snapshot to disk
    // In a real implementation, this would save to file system
  }

  private async loadSnapshotFromDisk(id: string): Promise<MemorySnapshot | null> {
    // Placeholder for loading snapshot from disk
    // In a real implementation, this would load from file system
    return null;
  }

  private async deleteSnapshotFromDisk(id: string): Promise<void> {
    // Placeholder for deleting snapshot from disk
    // In a real implementation, this would delete from file system
  }

  private async saveBackupToDisk(id: string, snapshot: MemorySnapshot): Promise<void> {
    // Placeholder for saving backup to disk
    // In a real implementation, this would save backup to file system
  }

  private async loadBackupFromDisk(id: string): Promise<MemorySnapshot | null> {
    // Placeholder for loading backup from disk
    // In a real implementation, this would load backup from file system
    return null;
  }

  private async cleanupOldSnapshots(): Promise<void> {
    const snapshots = Array.from(this.snapshots.entries());
    snapshots.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    // Keep only maxSnapshots number of snapshots
    const toDelete = snapshots.slice(this.config.maxSnapshots);
    
    for (const [id] of toDelete) {
      await this.deleteSnapshot(id);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    // Placeholder for backup cleanup
    // In a real implementation, this would clean up old backups
  }

  private async convertToCSV(snapshot: MemorySnapshot): Promise<string> {
    // Placeholder for CSV conversion
    // In a real implementation, this would convert snapshot to CSV format
    return JSON.stringify(snapshot);
  }

  private async convertFromCSV(data: string): Promise<MemorySnapshot> {
    // Placeholder for CSV conversion
    // In a real implementation, this would convert CSV to snapshot format
    return JSON.parse(data);
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.createSnapshot(`auto_${Date.now()}`);
      } catch (error) {
        this.handleError('Auto-save failed', error);
      }
    }, this.config.autoSaveInterval);
  }

  private updateSaveStats(saveTime: number): void {
    this.stats.totalSaves++;
    this.stats.lastSaveTime = Date.now();
    this.stats.averageSaveTime = 
      (this.stats.averageSaveTime * (this.stats.totalSaves - 1) + saveTime) / this.stats.totalSaves;
  }

  private updateLoadStats(loadTime: number): void {
    this.stats.totalLoads++;
    this.stats.lastLoadTime = Date.now();
    this.stats.averageLoadTime = 
      (this.stats.averageLoadTime * (this.stats.totalLoads - 1) + loadTime) / this.stats.totalLoads;
  }

  private handleError(message: string, error: any): void {
    this.stats.errorCount++;
    this.stats.lastError = `${message}: ${error.message || error}`;
    console.error(message, error);
  }
}