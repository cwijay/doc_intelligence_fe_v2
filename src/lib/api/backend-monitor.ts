/**
 * Backend health monitoring service
 * Provides continuous monitoring of backend services with status change notifications
 */

import { clientConfig } from '../config';

export interface BackendStatus {
  isAvailable: boolean;
  lastChecked: Date;
  latency?: number;
  error?: string;
  services: {
    main: boolean;
    rag: boolean;
    ingest: boolean;
  };
}

type StatusChangeListener = (status: BackendStatus) => void;

class BackendDetector {
  private status: BackendStatus = {
    isAvailable: false,
    lastChecked: new Date(),
    services: { main: false, rag: false, ingest: false },
  };

  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: StatusChangeListener[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.startMonitoring();
    }
  }

  async checkBackendHealth(): Promise<BackendStatus> {
    const startTime = Date.now();

    try {
      // Check main API (port 8000)
      const mainHealthy = await this.checkService(clientConfig.apiBaseUrl + '/health');

      // Check RAG API (port 8001) - optional
      const ragHealthy = await this.checkService(clientConfig.ragApiBaseUrl + '/health');

      // Check Ingest API (port 8001) - optional
      const ingestHealthy = await this.checkService(clientConfig.ingestApiBaseUrl + '/health');

      const latency = Date.now() - startTime;

      this.status = {
        isAvailable: mainHealthy,
        lastChecked: new Date(),
        latency,
        services: {
          main: mainHealthy,
          rag: ragHealthy,
          ingest: ingestHealthy,
        },
      };
    } catch (error: unknown) {
      this.status = {
        isAvailable: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : String(error),
        services: { main: false, rag: false, ingest: false },
      };
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(this.status));

    return this.status;
  }

  private async checkService(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkBackendHealth();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkBackendHealth();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getStatus(): BackendStatus {
    return { ...this.status };
  }

  onStatusChange(callback: StatusChangeListener): void {
    this.listeners.push(callback);
  }

  removeStatusListener(callback: StatusChangeListener): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }
}

// Global backend detector instance
export const backendDetector = new BackendDetector();
