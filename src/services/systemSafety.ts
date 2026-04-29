/**
 * System Safety Service
 * Monitors for abnormal activity and can trigger emergency shutdown
 */

import { adminService } from './adminService';
import logger from './logger';

export interface SafetyThresholds {
  maxRequestsPerMinute: number;
  maxQuestionsPerHour: number;
  maxNewUsersPerHour: number;
  maxFailedLoginsPerHour: number;
  maxSuspiciousIPsPerHour: number;
  maxErrorRatePercent: number;
}

export interface SystemMetrics {
  requestsPerMinute: number;
  questionsPerHour: number;
  newUsersPerHour: number;
  failedLoginsPerHour: number;
  suspiciousIPs: string[];
  errorRate: number;
  timestamp: Date;
}

export interface SafetyAlert {
  level: 'warning' | 'critical' | 'emergency';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  autoShutdown: boolean;
}

// Default safety thresholds
const DEFAULT_THRESHOLDS: SafetyThresholds = {
  maxRequestsPerMinute: 1000,      // Abnormal if > 1000 requests/min
  maxQuestionsPerHour: 5000,       // Abnormal if > 5000 questions/hour
  maxNewUsersPerHour: 100,         // Suspicious if > 100 signups/hour
  maxFailedLoginsPerHour: 500,     // Potential attack if > 500 failed logins
  maxSuspiciousIPsPerHour: 50,     // Too many blocked IPs indicates attack
  maxErrorRatePercent: 25          // System issues if error rate > 25%
};

class SystemSafetyService {
  private thresholds: SafetyThresholds = { ...DEFAULT_THRESHOLDS };
  private metrics: SystemMetrics[] = [];
  private alerts: SafetyAlert[] = [];
  private isSystemShutdown: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring system safety
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth();
    }, intervalMs);

    logger.info('System safety monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('System safety monitoring stopped');
    }
  }

  /**
   * Check system health and trigger alerts/shutdown if needed
   */
  async checkSystemHealth(): Promise<SafetyAlert[]> {
    if (this.isSystemShutdown) {
      return [];
    }

    const currentMetrics = await this.collectMetrics();
    this.metrics.push(currentMetrics);

    // Keep only last hour of metrics
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);

    const alerts: SafetyAlert[] = [];

    // Check each threshold
    if (currentMetrics.requestsPerMinute > this.thresholds.maxRequestsPerMinute) {
      alerts.push(this.createAlert(
        'critical',
        'Abnormal request rate detected',
        'requestsPerMinute',
        currentMetrics.requestsPerMinute,
        this.thresholds.maxRequestsPerMinute,
        true
      ));
    }

    if (currentMetrics.questionsPerHour > this.thresholds.maxQuestionsPerHour) {
      alerts.push(this.createAlert(
        'critical',
        'Abnormal question volume detected',
        'questionsPerHour',
        currentMetrics.questionsPerHour,
        this.thresholds.maxQuestionsPerHour,
        true
      ));
    }

    if (currentMetrics.newUsersPerHour > this.thresholds.maxNewUsersPerHour) {
      alerts.push(this.createAlert(
        'warning',
        'Suspicious signup rate detected',
        'newUsersPerHour',
        currentMetrics.newUsersPerHour,
        this.thresholds.maxNewUsersPerHour,
        false
      ));
    }

    if (currentMetrics.failedLoginsPerHour > this.thresholds.maxFailedLoginsPerHour) {
      alerts.push(this.createAlert(
        'critical',
        'Potential brute force attack detected',
        'failedLoginsPerHour',
        currentMetrics.failedLoginsPerHour,
        this.thresholds.maxFailedLoginsPerHour,
        true
      ));
    }

    if (currentMetrics.suspiciousIPs.length > this.thresholds.maxSuspiciousIPsPerHour) {
      alerts.push(this.createAlert(
        'critical',
        'DDoS attack suspected - too many blocked IPs',
        'suspiciousIPs',
        currentMetrics.suspiciousIPs.length,
        this.thresholds.maxSuspiciousIPsPerHour,
        true
      ));
    }

    if (currentMetrics.errorRate > this.thresholds.maxErrorRatePercent) {
      alerts.push(this.createAlert(
        'emergency',
        'System error rate critical',
        'errorRate',
        currentMetrics.errorRate,
        this.thresholds.maxErrorRatePercent,
        true
      ));
    }

    // Process alerts
    for (const alert of alerts) {
      this.alerts.push(alert);
      logger.error(`SAFETY ALERT: ${alert.message}`, {
        level: alert.level,
        metric: alert.metric,
        value: alert.currentValue,
        threshold: alert.threshold
      });

      // Trigger emergency shutdown if needed
      if (alert.autoShutdown && alert.level === 'emergency') {
        await this.emergencyShutdown('Critical safety threshold exceeded');
      }
    }

    // Auto-shutdown if multiple critical alerts
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length >= 3) {
      await this.emergencyShutdown('Multiple critical safety thresholds exceeded');
    }

    return alerts;
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    // In production, these would come from real monitoring
    // For now, using simulated data
    const blockedIPs = await adminService.getBlockedIPs();
    
    return {
      requestsPerMinute: Math.floor(Math.random() * 200), // Simulated
      questionsPerHour: Math.floor(Math.random() * 500),  // Simulated
      newUsersPerHour: Math.floor(Math.random() * 20),    // Simulated
      failedLoginsPerHour: Math.floor(Math.random() * 50), // Simulated
      suspiciousIPs: blockedIPs.map(ip => ip.ip),
      errorRate: Math.random() * 10, // Simulated error rate %
      timestamp: new Date()
    };
  }

  /**
   * Create a safety alert
   */
  private createAlert(
    level: 'warning' | 'critical' | 'emergency',
    message: string,
    metric: string,
    currentValue: number,
    threshold: number,
    autoShutdown: boolean
  ): SafetyAlert {
    return {
      level,
      message,
      metric,
      currentValue,
      threshold,
      timestamp: new Date(),
      autoShutdown
    };
  }

  /**
   * Emergency shutdown procedure
   */
  async emergencyShutdown(reason: string): Promise<void> {
    if (this.isSystemShutdown) {
      return;
    }

    logger.error(`EMERGENCY SHUTDOWN INITIATED: ${reason}`);
    this.isSystemShutdown = true;

    // In production, this would:
    // 1. Block all new requests
    // 2. Notify administrators via email/SMS
    // 3. Save current state
    // 4. Gracefully close connections
    // 5. Log all details for forensics

    // Notify admins
    logger.error('🚨 EMERGENCY SHUTDOWN 🚨', { reason });
    logger.error('System is now in lockdown mode');
    
    // Stop monitoring
    this.stopMonitoring();

    // In a real system, you would:
    // - Update Firebase to reject all requests
    // - Send alerts to admin emails
    // - Create incident report
  }

  /**
   * Resume system after emergency shutdown
   */
  async resumeSystem(adminKey: string): Promise<boolean> {
    // Verify admin key (in production, this would be more secure)
    if (adminKey !== 'ADMIN_OVERRIDE_KEY_2024') {
      logger.warn('Invalid admin key for system resume');
      return false;
    }

    this.isSystemShutdown = false;
    this.alerts = [];
    logger.info('System resumed from emergency shutdown');
    
    // Restart monitoring
    this.startMonitoring();
    
    return true;
  }

  /**
   * Update safety thresholds
   */
  updateThresholds(newThresholds: Partial<SafetyThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Safety thresholds updated', this.thresholds);
  }

  /**
   * Get current system status
   */
  getSystemStatus(): SystemStatus {
    return {
      isShutdown: this.isSystemShutdown,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      currentMetrics: this.metrics[this.metrics.length - 1] || null,
      thresholds: this.thresholds
    };
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }
}

// Export SystemStatus type
export interface SystemStatus {
  isShutdown: boolean;
  alerts: SafetyAlert[];
  currentMetrics: SystemMetrics | null;
  thresholds: SafetyThresholds;
}

export const systemSafety = new SystemSafetyService();

// Auto-start monitoring in production
if (process.env['NODE_ENV'] === 'production') {
  systemSafety.startMonitoring();
}
