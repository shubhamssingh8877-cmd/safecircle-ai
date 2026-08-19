/**
 * Browser Notification Service for SafeCircle AI
 * Provides safe wrappers around the Web Notification API with fallbacks.
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[SafeCircle] Notification permission request error:', err);
    return Notification.permission;
  }
}

export interface SafetyNotificationOptions {
  body: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, any>;
}

export function sendSafetyNotification(
  title: string,
  options: SafetyNotificationOptions
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options.body,
      tag: options.tag || 'safecircle-safety-alert',
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
      icon: '/favicon.ico',
    });

    if (!options.requireInteraction) {
      setTimeout(() => {
        try {
          notification.close();
        } catch {
          // ignore close errors
        }
      }, 8000);
    }

    return true;
  } catch (err) {
    console.warn('[SafeCircle] Error sending notification:', err);
    return false;
  }
}

export const NotificationTriggers = {
  sosActivated: (locationText: string) => {
    return sendSafetyNotification('🚨 SafeCircle Emergency SOS Activated', {
      body: `Emergency alert triggered. Location snapshot: ${locationText}. Tap to review escalation status.`,
      tag: 'safecircle-sos-active',
      requireInteraction: true,
    });
  },

  checkinRequired: (cadenceMinutes: number) => {
    return sendSafetyNotification('⏰ SafeCircle Check-In Required', {
      body: `Your scheduled ${cadenceMinutes}-minute safety ping is ready. Please confirm you are safe.`,
      tag: 'safecircle-checkin-ping',
      requireInteraction: false,
    });
  },

  checkinOverdue: (graceSecondsRemaining: number = 60) => {
    return sendSafetyNotification('⏰ SafeCircle Alert: Scheduled check-in overdue.', {
      body: `Confirm safety or snooze. Auto-escalation triggers in ${graceSecondsRemaining}s if unconfirmed.`,
      tag: 'safecircle-checkin-overdue',
      requireInteraction: true,
    });
  },

  routeDeviation: (distanceMeters: number) => {
    return sendSafetyNotification('⚠️ Route Deviation Detected', {
      body: `You are approximately ${distanceMeters}m from your planned corridor. Please confirm your safety or recalculate.`,
      tag: 'safecircle-route-deviation',
      requireInteraction: true,
    });
  },
};
