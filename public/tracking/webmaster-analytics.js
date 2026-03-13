/**
 * Webmaster Analytics Tracking Script
 *
 * Usage:
 * Add this to your website's <head> tag:
 *
 * <script>
 *   window.WEBMASTER_SITE_ID = 'your-website-id-here';
 *   window.WEBMASTER_API_URL = 'https://your-webmaster-app.vercel.app';
 * </script>
 * <script src="https://your-webmaster-app.vercel.app/tracking/webmaster-analytics.js" async></script>
 */

(function() {
  'use strict';

  // Configuration
  const API_URL = window.WEBMASTER_API_URL || 'http://localhost:3000';
  const SITE_ID = window.WEBMASTER_SITE_ID;

  if (!SITE_ID) {
    console.warn('[Webmaster Analytics] WEBMASTER_SITE_ID not defined');
    return;
  }

  const TRACK_ENDPOINT = API_URL + '/api/track';
  const ERROR_ENDPOINT = API_URL + '/api/track/error';

  // Generate session ID
  let sessionId = sessionStorage.getItem('webmaster_session_id');
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem('webmaster_session_id', sessionId);
  }

  // Utility functions
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function getReferrer() {
    const ref = document.referrer;
    if (!ref) return 'direct';

    try {
      const refUrl = new URL(ref);
      if (refUrl.hostname === window.location.hostname) {
        return 'internal';
      }
      return refUrl.hostname;
    } catch {
      return 'unknown';
    }
  }

  function getCountry() {
    // Will be determined server-side via IP
    return null;
  }

  // Send tracking event
  function track(eventType, data = {}) {
    const payload = {
      siteId: SITE_ID,
      eventType,
      sessionId,
      url: window.location.href,
      referrer: getReferrer(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      timestamp: new Date().toISOString(),
      ...data
    };

    // Use sendBeacon for better reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(TRACK_ENDPOINT, blob);
    } else {
      // Fallback to fetch
      fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {
        // Silent fail
      });
    }
  }

  // Track pageview
  track('pageview', {
    pageTitle: document.title,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language
  });

  // Track errors
  window.addEventListener('error', function(event) {
    const errorData = {
      errorMessage: event.message,
      errorType: event.error?.name || 'Error',
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    };

    fetch(ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: SITE_ID,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...errorData
      }),
      keepalive: true
    }).catch(() => {});
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    fetch(ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: SITE_ID,
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorMessage: event.reason?.message || String(event.reason),
        errorType: 'UnhandledPromiseRejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      }),
      keepalive: true
    }).catch(() => {});
  });

  // Track outbound links
  document.addEventListener('click', function(event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    try {
      const linkUrl = new URL(href, window.location.href);
      if (linkUrl.hostname !== window.location.hostname) {
        track('click', {
          clickType: 'outbound_link',
          targetUrl: linkUrl.href,
          linkText: link.textContent?.trim().substring(0, 100)
        });
      }
    } catch {
      // Invalid URL
    }
  });

  // Track time on page (send on unload)
  const startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000); // seconds
    track('session_end', {
      timeOnPage,
      scrollDepth: Math.round((window.scrollY / document.body.scrollHeight) * 100)
    });
  });

  // Expose track function for custom events
  window.webmasterTrack = function(eventName, customData) {
    track('custom', {
      eventName,
      ...customData
    });
  };

  console.log('[Webmaster Analytics] Tracking initialized for site:', SITE_ID);
})();
