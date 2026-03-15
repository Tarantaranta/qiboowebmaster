/**
 * Webmaster Analytics Tracking Script
 * Lightweight analytics tracker for monitoring website activity
 *
 * Usage: Add to your website's <head> tag:
 * <script src="https://your-dashboard-domain.vercel.app/track.js" data-site="yourdomain.com"></script>
 */

(function() {
  'use strict';

  // Get configuration from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-site]');
  const SITE_DOMAIN = currentScript?.getAttribute('data-site');
  const API_URL = currentScript?.src?.split('/track.js')[0] + '/api/track';

  if (!SITE_DOMAIN) {
    console.warn('[Webmaster Analytics] Missing data-site attribute');
    return;
  }

  // Generate or retrieve session ID
  function getSessionId() {
    const SESSION_KEY = 'wm_session_id';
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    const stored = sessionStorage.getItem(SESSION_KEY);
    const storedTime = sessionStorage.getItem(SESSION_KEY + '_time');

    const now = Date.now();

    // Check if session expired
    if (stored && storedTime && (now - parseInt(storedTime)) < SESSION_DURATION) {
      // Extend session
      sessionStorage.setItem(SESSION_KEY + '_time', now.toString());
      return stored;
    }

    // Create new session
    const newSessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, newSessionId);
    sessionStorage.setItem(SESSION_KEY + '_time', now.toString());

    return newSessionId;
  }

  // Detect device type
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

  // Send tracking event
  function track(eventType, additionalData = {}) {
    const data = {
      siteId: SITE_DOMAIN,
      eventType,
      sessionId: getSessionId(),
      url: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      timestamp: new Date().toISOString(),
      pageTitle: document.title,
      ...additionalData
    };

    // Send beacon (non-blocking, works even on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(API_URL, blob);
    } else {
      // Fallback to fetch
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(err => console.error('[Webmaster Analytics] Track error:', err));
    }
  }

  // Track pageview on load
  if (document.readyState === 'complete') {
    track('pageview');
  } else {
    window.addEventListener('load', () => track('pageview'));
  }

  // Track time on page and scroll depth on exit
  let pageLoadTime = Date.now();
  let maxScrollDepth = 0;

  function updateScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const currentDepth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
    maxScrollDepth = Math.max(maxScrollDepth, currentDepth);
  }

  window.addEventListener('scroll', updateScrollDepth, { passive: true });

  // Track on page exit
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000); // seconds
    track('page_exit', {
      timeOnPage,
      scrollDepth: maxScrollDepth
    });
  });

  // Track external link clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    try {
      const linkUrl = new URL(link.href);
      const currentUrl = new URL(window.location.href);

      // External link
      if (linkUrl.hostname !== currentUrl.hostname) {
        track('click', {
          clickType: 'external_link',
          targetUrl: link.href,
          linkText: link.textContent?.trim().substring(0, 100)
        });
      }
    } catch (err) {
      // Invalid URL, ignore
    }
  }, { passive: true });

  // Track chatbot events (if chatbot exists)
  window.trackChatbotEvent = function(eventName, metadata = {}) {
    track('chatbot', {
      eventName,
      ...metadata
    });
  };

  // Expose tracking function globally (optional)
  window.webmasterAnalytics = {
    track: track,
    getSessionId: getSessionId
  };

  // Track custom events
  window.addEventListener('webmaster-track', function(e) {
    if (e.detail && e.detail.eventType) {
      track(e.detail.eventType, e.detail.data || {});
    }
  });

})();
