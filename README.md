📦 modern-load

A modernized, feature-rich version of the original load package with ESM, watch mode, source maps, events, and browser support

https://badge.fury.io/js/modern-load.svg
https://img.shields.io/badge/License-MIT-yellow.svg
https://img.shields.io/node/v/modern-load.svg

✨ Features

· 🚀 Promise-based API - Async/await ready with full Promise support
· 📦 ES Module Support - Load .mjs files natively with import()
· 👁️ Watch Mode - Auto-reload modules on file changes (great for development)
· 🗺️ Source Map Support - Better debugging with original code traces
· 📡 Event Emitter Interface - Real-time feedback for all operations
· 🌐 Browser Support - Same API works in browsers via fetch + eval
· 💾 Cache Control - Built-in caching with TTL support
· 🔒 Sandbox/Context Isolation - Secure execution in isolated contexts
· ⏱️ Timeout Control - Prevent infinite loops or long-running scripts
· 🛡️ Better Error Messages - Clear, actionable error reporting

📦 Installation

```bash
npm install modern-load
```

🚀 Quick Start

Basic Usage (Node.js)

```javascript
import load from 'modern-load';

// Load a file
const { test, library } = await load.file('./my-module.js');
console.log(test()); // Outputs: Hello from modern-load!

// Load a script string
const exports = await load.script('const answer = 42;');
console.log(exports.answer); // 42
```

Traditional Callback Style

```javascript
const load = require('modern-load');

load.file('./my-module.js', (err, exports) => {
  if (err) throw err;
  console.log(exports.test());
});
```

📚 Advanced Usage

1. ES Module Support (.mjs)

```javascript
// Load ES Module files natively
const module = await load.file('./library.mjs', {
  cache: true
});

console.log(module.default); // ES module exports
```

2. Watch Mode (Auto-Reload)

```javascript
const watcher = load.watch('./dev-module.js', (err, exports) => {
  if (err) {
    console.error('Error in watched file:', err);
    return;
  }
  console.log('🔄 Module reloaded!', exports);
}, { 
  sourceMaps: true,
  cache: true
});

// Stop watching later
watcher.close();

// Or manually reload
await watcher.reload();
```

3. Event Emitter Interface

```javascript
import { Loader } from 'modern-load';

const loader = new Loader({
  timeout: 3000,
  sandbox: { API_KEY: 'secret' }
});

// Listen to lifecycle events
loader.on('load:start', ({ filePath }) => {
  console.log(`⏳ Loading: ${filePath}`);
});

loader.on('load:done', ({ filePath, exports }) => {
  console.log(`✅ Loaded: ${filePath}`, Object.keys(exports));
});

loader.on('load:error', ({ filePath, error }) => {
  console.error(`❌ Error: ${filePath}`, error.message);
});

loader.on('load:cache', ({ filePath, exports }) => {
  console.log(`💾 Using cached version of: ${filePath}`);
});

loader.on('watch:change', ({ filePath }) => {
  console.log(`📝 File changed: ${filePath}`);
});

// Load with events
const exports = await loader.file('./my-module.js', {
  cache: true,
  sourceMaps: true
});
```

4. Browser Usage

```html
<!-- Using ES modules -->
<script type="module">
  import { BrowserLoader } from 'https://cdn.jsdelivr.net/npm/modern-load/browser.js';
  
  const loader = new BrowserLoader();
  const exports = await loader.file('https://example.com/my-script.js', {
    cache: true,
    ttl: 30000
  });
  
  console.log('Loaded:', exports);
</script>

<!-- Or using script tag -->
<script src="https://cdn.jsdelivr.net/npm/modern-load/browser.js"></script>
<script>
  const loader = window.ModernLoad.default;
  
  loader.file('https://example.com/library.js')
    .then(exports => console.log('Library loaded:', exports))
    .catch(err => console.error('Error:', err));
</script>
```

5. Sandbox & Security

```javascript
import { Loader } from 'modern-load';

// Create a restricted sandbox
const loader = new Loader({
  sandbox: {
    console,
    Math,
    // Exclude sensitive APIs
    process: undefined,
    require: undefined
  },
  timeout: 1000 // Kill scripts after 1 second
});

// Load untrusted code safely
try {
  const exports = await loader.file('./untrusted.js');
  console.log(exports);
} catch (error) {
  console.error('Script execution failed:', error.message);
}
```

6. Cache Management

```javascript
import load from 'modern-load';

// Load with caching
const exports1 = await load.file('./module.js', { cache: true });
const exports2 = await load.file('./module.js', { 
  cache: true,
  ttl: 30000 // Cache for 30 seconds
});

// Clear specific cache
load.clearCache('./module.js');

// Clear all cache
load.clearCache();

// Create a loader with custom cache
import { Loader } from 'modern-load';
const loader = new Loader();
loader.cache.set('my-key', { exports: data, timestamp: Date.now() });
```

7. Source Maps Support

```javascript
const exports = await load.file('./compiled.js', {
  sourceMaps: true, // Better stack traces
  cache: true
});

// Listen to source map events
loader.on('load:sourcemap', ({ filePath, sourceMap }) => {
  console.log('Source map loaded:', filePath);
});
```

🎯 API Reference

load.file(filePath, options)

Loads a JavaScript file and returns its exported globals.

Parameter Type Description
filePath string Path to the JavaScript file
options.cache boolean Enable caching (default: false)
options.ttl number Cache TTL in milliseconds (default: 60000)
options.sourceMaps boolean Enable source map support
options.timeout number Execution timeout in milliseconds

Returns: Promise<Object> - Exported globals

---

load.script(scriptCode, options)

Executes a script string and returns its globals.

Parameter Type Description
scriptCode string JavaScript code to execute
options.sourceMaps boolean Enable source map support
options.timeout number Execution timeout in milliseconds

Returns: Promise<Object> - Exported globals

---

load.watch(filePath, callback, options)

Watches a file and auto-reloads on changes.

Parameter Type Description
filePath string Path to the file to watch
callback function Called on each reload
options Object Same as load.file() options

Returns: Object - Watcher with close() and reload() methods

---

load.clearCache(filePath)

Clears the cache for a specific file or all files.

Parameter Type Description
filePath string Optional - Clear specific file

---

load.stopAllWatchers()

Stops all active file watchers.

---

📡 Events

The Loader class emits the following events:

Event Payload Description
load:start { filePath, options } Before loading starts
load:done { filePath, exports } Loading completed successfully
load:error { filePath, error } Loading failed
load:cache { filePath, exports } Using cached version
load:sourcemap { filePath, sourceMap } Source map loaded
watch:change { filePath, eventType } File changed
watch:reload { filePath, exports } File reloaded successfully
watch:error { filePath, error } Watch error occurred
watch:initial { filePath, exports } First load in watch mode
watch:stop { filePath } Watcher stopped
cache:clear { filePath or all: true } Cache cleared

🔧 Configuration

Loader Constructor Options

```javascript
const loader = new Loader({
  timeout: 5000,          // Default timeout (ms)
  sandbox: {              // Custom sandbox context
    console,
    Math,
    // ... custom globals
  }
});
```

📝 Examples

Plugin System

```javascript
import { Loader } from 'modern-load';

const pluginLoader = new Loader({
  sandbox: { 
    console, 
    fetch, 
    Buffer 
  },
  timeout: 3000
});

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.loader = new Loader();
  }

  async loadPlugin(name, filePath) {
    const exports = await this.loader.file(filePath, { 
      cache: true,
      sourceMaps: true 
    });
    
    this.plugins.set(name, exports);
    return exports;
  }

  async reloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    
    const exports = await this.loader.file(plugin.filePath, { 
      cache: false 
    });
    
    this.plugins.set(name, exports);
    return exports;
  }
}

// Usage
const manager = new PluginManager();
await manager.loadPlugin('awesome-plugin', './plugins/awesome.js');
```

Hot Module Replacement (HMR)

```javascript
import { Loader } from 'modern-load';

class HotModule {
  constructor() {
    this.loader = new Loader();
    this.modules = new Map();
  }

  register(name, filePath) {
    const watcher = this.loader.watch(filePath, (err, exports) => {
      if (err) {
        console.error(`[${name}] Failed to reload:`, err);
        return;
      }
      
      this.modules.set(name, exports);
      this.onReload(name, exports);
    });
    
    this.modules.set(name, { exports: null, watcher, filePath });
  }

  onReload(name, exports) {
    console.log(`[${name}] Hot reloaded!`);
    // Custom logic here
  }

  get(name) {
    return this.modules.get(name)?.exports || null;
  }

  stopAll() {
    this.loader.stopAllWatchers();
  }
}

// Usage
const hmr = new HotModule();
hmr.register('app', './app.js');
```

🌐 Browser Compatibility

The browser version uses:

· fetch() for loading remote scripts
· Function() constructor for safe code execution
· EventEmitter polyfill for event handling

Supported browsers: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+

📄 License

MIT © s1vann
