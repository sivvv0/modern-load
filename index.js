import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import vm from 'vm';
import { EventEmitter } from 'events';
import { watch } from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Modernized load module with advanced features
 */
class Loader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.cache = new Map();
    this.watchers = new Map();
    this.options = {
      timeout: options.timeout || 5000,
      sandbox: options.sandbox || null,
      ...options
    };
  }

  /**
   * Loads a JavaScript file and returns its exported globals.
   * Supports .js (CommonJS) and .mjs (ES Modules)
   */
  async file(filePath, options = {}) {
    try {
      this.emit('load:start', { filePath, options });
      
      const absolutePath = path.resolve(filePath);
      const isESM = filePath.endsWith('.mjs');
      
      // Check cache
      if (options.cache && this.cache.has(absolutePath)) {
        const entry = this.cache.get(absolutePath);
        if (Date.now() - entry.timestamp < (options.ttl || 60000)) {
          this.emit('load:cache', { filePath, exports: entry.exports });
          return entry.exports;
        }
      }

      let exports;

      if (isESM) {
        // ES Module loading
        const url = `file://${absolutePath}`;
        const module = await import(url);
        exports = module.default || module;
        
        // Handle source maps if available
        if (options.sourceMaps) {
          // Source map support via magic comments or separate .map file
          const mapPath = `${absolutePath}.map`;
          try {
            const mapContent = await readFile(mapPath, 'utf8');
            const sourceMap = JSON.parse(mapContent);
            this.emit('load:sourcemap', { filePath, sourceMap });
          } catch (e) {
            // No source map found, continue
          }
        }
      } else {
        // CommonJS with vm
        const code = await readFile(absolutePath, 'utf8');
        const context = vm.createContext({
          ...global,
          require,
          __dirname: path.dirname(absolutePath),
          __filename: absolutePath,
          console,
          setTimeout,
          clearTimeout,
          setInterval,
          clearInterval,
          ...(this.options.sandbox || {})
        });

        const script = new vm.Script(code, {
          filename: absolutePath,
          displayErrors: true,
          ...(options.sourceMaps && { sourceMap: true })
        });

        const initialGlobals = Object.keys(global);
        const result = script.runInContext(context, {
          timeout: options.timeout || this.options.timeout
        });

        // Extract new globals
        const newGlobals = Object.keys(global).filter(key => !initialGlobals.includes(key));
        exports = {};
        newGlobals.forEach(key => { exports[key] = global[key]; });
        
        // If script returns something explicitly, use that too
        if (result !== undefined) {
          exports.result = result;
        }
      }

      // Cache the result
      if (options.cache) {
        this.cache.set(absolutePath, {
          exports,
          timestamp: Date.now(),
          filePath: absolutePath
        });
      }

      this.emit('load:done', { filePath, exports });
      return exports;

    } catch (error) {
      this.emit('load:error', { filePath, error });
      throw new Error(`Failed to load ${filePath}: ${error.message}`);
    }
  }

  /**
   * Loads a script string and returns its globals
   */
  async script(scriptCode, options = {}) {
    try {
      this.emit('load:start', { script: true, options });
      
      const context = vm.createContext({
        ...global,
        ...(this.options.sandbox || {})
      });
      
      const script = new vm.Script(scriptCode, {
        displayErrors: true,
        ...(options.sourceMaps && { sourceMap: true })
      });
      
      const initialGlobals = Object.keys(global);
      const result = script.runInContext(context, {
        timeout: options.timeout || this.options.timeout
      });
      
      const newGlobals = Object.keys(global).filter(key => !initialGlobals.includes(key));
      const exports = {};
      newGlobals.forEach(key => { exports[key] = global[key]; });
      
      if (result !== undefined) {
        exports.result = result;
      }
      
      this.emit('load:done', { script: true, exports });
      return exports;
      
    } catch (error) {
      this.emit('load:error', { script: true, error });
      throw new Error(`Failed to execute script: ${error.message}`);
    }
  }

  /**
   * Watch mode - automatically reload file on changes
   */
  watch(filePath, callback, options = {}) {
    const absolutePath = path.resolve(filePath);
    
    // If already watching, stop previous watcher
    if (this.watchers.has(absolutePath)) {
      this.watchers.get(absolutePath).close();
    }

    // Initial load
    this.file(filePath, options)
      .then(exports => {
        if (callback) callback(null, exports);
        this.emit('watch:initial', { filePath, exports });
      })
      .catch(err => {
        if (callback) callback(err, null);
        this.emit('watch:error', { filePath, error: err });
      });

    // Setup file watcher
    const watcher = watch(absolutePath, async (eventType) => {
      if (eventType === 'change') {
        this.emit('watch:change', { filePath, eventType });
        
        // Clear cache for this file
        this.cache.delete(absolutePath);
        
        try {
          const exports = await this.file(filePath, { 
            ...options, 
            cache: false // Don't use cache for reloads
          });
          
          if (callback) callback(null, exports);
          this.emit('watch:reload', { filePath, exports });
          
        } catch (error) {
          if (callback) callback(error, null);
          this.emit('watch:error', { filePath, error });
        }
      }
    });

    // Store watcher reference
    this.watchers.set(absolutePath, watcher);
    
    // Return watcher with stop method
    return {
      close: () => {
        watcher.close();
        this.watchers.delete(absolutePath);
        this.emit('watch:stop', { filePath });
      },
      reload: async () => {
        this.cache.delete(absolutePath);
        const exports = await this.file(filePath, { ...options, cache: false });
        if (callback) callback(null, exports);
        return exports;
      }
    };
  }

  /**
   * Clear cache for specific or all files
   */
  clearCache(filePath) {
    if (filePath) {
      const absolutePath = path.resolve(filePath);
      this.cache.delete(absolutePath);
      this.emit('cache:clear', { filePath: absolutePath });
    } else {
      this.cache.clear();
      this.emit('cache:clear', { all: true });
    }
  }

  /**
   * Stop all watchers
   */
  stopAllWatchers() {
    for (const [filePath, watcher] of this.watchers) {
      watcher.close();
      this.emit('watch:stop', { filePath });
    }
    this.watchers.clear();
  }
}

// Create default instance
const defaultLoader = new Loader();

// Export both class and default instance
export { Loader };
export default defaultLoader;
