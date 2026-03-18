/**
 * Webmaster Analytics - Core Web Vitals Extension
 *
 * This script tracks Core Web Vitals (LCP, INP, CLS, TTFB, FCP)
 * Add AFTER the main webmaster-analytics.js script
 *
 * Usage:
 * <script src="https://your-webmaster-app.vercel.app/tracking/webmaster-analytics.js" async></script>
 * <script src="https://your-webmaster-app.vercel.app/tracking/webmaster-analytics-vitals.js" async></script>
 */

(function() {
  'use strict';

  const API_URL = window.WEBMASTER_API_URL || 'https://qiboowebmasterapp.vercel.app';
  const SITE_ID = window.WEBMASTER_SITE_ID;

  if (!SITE_ID) {
    console.warn('[Webmaster Vitals] WEBMASTER_SITE_ID not defined');
    return;
  }

  const VITALS_ENDPOINT = API_URL + '/api/track/vitals';

  /**
   * Send Web Vital metric to server
   */
  function sendVital(metric) {
    const data = {
      siteId: SITE_ID,
      url: window.location.href,
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate'
    };

    // Use sendBeacon if available (non-blocking)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(VITALS_ENDPOINT, blob);
    } else {
      // Fallback to fetch
      fetch(VITALS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(err => console.warn('[Webmaster Vitals] Failed to send:', err));
    }

    console.log('[Webmaster Vitals]', metric.name, metric.value, metric.rating);
  }

  /**
   * Load and initialize web-vitals library from CDN
   */
  function loadWebVitals() {
    // Check if already loaded
    if (window.webVitals) {
      initWebVitals();
      return;
    }

    // Load from UNPKG CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/web-vitals@4/dist/web-vitals.iife.js';
    script.async = true;
    script.onload = function() {
      console.log('[Webmaster Vitals] Library loaded');
      initWebVitals();
    };
    script.onerror = function() {
      console.error('[Webmaster Vitals] Failed to load library');
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize Web Vitals tracking
   */
  function initWebVitals() {
    if (!window.webVitals) {
      console.warn('[Webmaster Vitals] Library not available');
      return;
    }

    try {
      // Track Core Web Vitals (2026 metrics)
      window.webVitals.onLCP(sendVital); // Largest Contentful Paint
      window.webVitals.onINP(sendVital); // Interaction to Next Paint (replaced FID)
      window.webVitals.onCLS(sendVital); // Cumulative Layout Shift

      // Track additional metrics
      window.webVitals.onTTFB(sendVital); // Time to First Byte
      window.webVitals.onFCP(sendVital);  // First Contentful Paint

      console.log('[Webmaster Vitals] Tracking initialized');
    } catch (err) {
      console.error('[Webmaster Vitals] Initialization error:', err);
    }
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'complete') {
    loadWebVitals();
  } else {
    window.addEventListener('load', loadWebVitals);
  }
})();
