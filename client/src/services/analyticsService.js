// Privacy-Preserving Client Telemetry Tracker (No 3rd Party Data Exposure)

class PrivacyAnalytics {
  constructor() {
    this.events = [];
    this.enabled = true;
  }

  trackPageView(path) {
    if (!this.enabled) return;
    const event = {
      type: 'pageview',
      path,
      timestamp: new Date().toISOString()
    };
    this.events.push(event);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Privacy Telemetry] Pageview:', path);
    }
  }

  trackSecurityEvent(action, details = {}) {
    if (!this.enabled) return;
    const event = {
      type: 'security_event',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.events.push(event);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Security Telemetry]', action, details);
    }
  }

  getMetrics() {
    return {
      totalPageviews: this.events.filter(e => e.type === 'pageview').length,
      securityEventsCount: this.events.filter(e => e.type === 'security_event').length,
      history: this.events.slice(-20)
    };
  }
}

export const analytics = new PrivacyAnalytics();
