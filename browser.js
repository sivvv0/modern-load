/**
 * Browser-compatible version using eval and Function constructor
 * For use in browsers via script tag or module import
discord:- s1vann
 */

class BrowserLoader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.cache = new Map();
    this.options = options;
  }

  /**
   * Load script from URL (browser)
   */
  async script(scriptCode, options = {}) {
    try {
      this.emit('load:start', { script: true, options });
      
      // Use Function constructor for better isolation than eval
      const fn = new Function(`
        "use strict";
        ${scriptCode}
        // Collect all top-level variables
        return { 
          result: (typeof result !== 'undefined' ? result : undefined),
          // Add any other exports you want to capture
        };
      `);
      
      const exports = fn();
      
      this.emit('load:done', { script: true, exports });
      return exports;
      
    } catch (error) {
      this.emit('load:error', { script: true, error });
      throw error;
    }
  }

  /**
   * Load script from URL (fetch + eval)
   */
  async file(url, options = {}) {
    try {
      this.emit('load:start', { file: url, options });
      
      // Check cache
      if (options.cache && this.cache.has(url)) {
        const entry = this.cache.get(url);
        if (Date.now() - entry.timestamp < (options.ttl || 60000)) {
          this.emit('load:cache', { file: url, exports: entry.exports });
          return entry.exports;
        }
      }

      // Fetch the script
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const scriptCode = await response.text();
      
      // Execute using Function constructor
      const fn = new Function(`
        "use strict";
        ${scriptCode}
        // Return any exports (global variables or module.exports)
        return {
          ...(typeof window !== 'undefined' ? window : global),
          ...(typeof module !== 'undefined' && module.exports ? module.exports : {})
        };
      `);
      
      const exports = fn();
      
      // Cache
      if (options.cache) {
        this.cache.set(url, {
          exports,
          timestamp: Date.now()
        });
      }
      
      this.emit('load:done', { file: url, exports });
      return exports;
      
    } catch (error) {
      this.emit('load:error', { file: url, error });
      throw error;
    }
  }
}

// Export for different environments
export { BrowserLoader };

// For script tag usage (IIFE)
if (typeof window !== 'undefined') {
  window.ModernLoad = {
    BrowserLoader,
    default: new BrowserLoader()
  };
}
