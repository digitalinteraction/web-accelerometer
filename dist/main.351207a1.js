// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"js/util.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sleep = sleep;
exports.localTime = localTime;
exports.localTimeString = localTimeString;
exports.localTimeValue = localTimeValue;
exports.watchParameters = watchParameters;
exports.redirectConsole = redirectConsole;
exports.padHex = padHex;
exports.hexDump = hexDump;
exports.download = download;
exports.cleanString = cleanString;

// Async sleep for milliseconds
async function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
} // Returns a non-timezone date/time (using UTC) for the specified local time


function localTime(date) {
  if (typeof date !== 'object') return null;
  const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffset);
}

function localTimeString(date, minutes) {
  const local = localTime(date);
  if (local === null) return null;
  const localString = local.toISOString().slice(0, -1);
  if (minutes) return localString.slice(0, -7);
  return localString;
}

function localTimeValue(str) {
  if (typeof str !== 'string' || str.length === 0) return null;
  if (str.length == 16) str += ':00';
  if (str.length == 19) str += '.000';
  if (str.length == 23) str += 'Z';
  const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
  const local = new Date(new Date(str).getTime() + tzOffset);
  return local;
} // Retrieve page address parameters and watch for (non-reload) hash parameter changes


function watchParameters(callback) {
  function hashchange() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, '')); // List of all keys/values in order, including duplicates

    const paramList = [];

    for (let urlSearchParams of [searchParams, hashParams]) {
      for (let paramKeyValue of urlSearchParams.entries()) {
        paramList.push(paramKeyValue);
      }
    } //console.log('PARAM-LIST: ' + JSON.stringify(paramList));
    // Object representation, lowercase keys, duplicates replace previous


    const params = {};

    for (let paramKeyValue of paramList) {
      params[paramKeyValue[0].toLowerCase()] = paramKeyValue[1];
    } //console.log('PARAMS: ' + JSON.stringify(params));


    callback(params, paramList);
  }

  window.onhashchange = hashchange;
  hashchange();
} // Intercept console writes to append to page element - safe to call before DOM loaded


function redirectConsole(selector, newElement = 'P') {
  function log(selector, category, ...message) {
    const elem = document.querySelector(selector);
    const msg = message.join(' ');

    if (!elem) {
      return '[pre-DOM] ' + msg;
    }

    const textnode = document.createTextNode(msg);
    const node = document.createElement(newElement);
    node.appendChild(textnode);
    elem.appendChild(node);
    node.scrollIntoView(false);
    return msg;
  }

  for (let category of ['log', 'warn', 'error']) {
    const original = console[category];

    console[category] = function () {
      const response = log(selector, category, ...arguments);
      original(response);
    };
  }
}

function padHex(value) {
  return ('0' + value.toString(16).toUpperCase()).slice(-2);
}

function hexDump(values) {
  let elements = [];

  for (let i = 0; i < values.byteLength; i++) {
    elements.push(padHex(values.getUint8(i)));
  }

  return elements.join(' ');
}

function download(filename, data) {
  const anchorElement = document.createElement('A');

  if (data instanceof ArrayBuffer) {
    data = [data];
  }

  if (Array.isArray(data)) {
    data = new Blob(data, {
      type: 'application/octet-binary'
    });
  }

  let url;

  if (data instanceof Blob) {
    url = URL.createObjectURL(data);
  } else {
    // string
    url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data);
  }

  anchorElement.setAttribute('href', url);
  anchorElement.setAttribute('download', filename);
  anchorElement.style.display = 'none';
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);
} // Filename-friendly string


function cleanString(text) {
  let output = '';
  let interrupted = false;

  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);

    if (c >= 0x30 && c <= 0x39 || c >= 0x41 && c <= 0x5a || c >= 0x61 && c <= 0x7a || c == 0x2d) {
      if (interrupted) {
        output += '_';
      }

      output += String.fromCharCode(c);
      interrupted = false;
    } else {
      interrupted = true;
    }
  }

  return output;
}
},{}],"js/main.mjs":[function(require,module,exports) {
"use strict";

var _util = require("./util.mjs");

window.addEventListener("error", function (e) {
  document.getElementById('warnings').appendChild(document.createTextNode('⚠️ Unhandled error.'));
  console.log("ERROR: Unhandled error: " + (e.error && e.error.message ? e.error.message : e.error));
  console.log(JSON.stringify(e));
  return false;
});
window.addEventListener("unhandledrejection", function (e) {
  document.getElementById('warnings').appendChild(document.createTextNode('⚠️ Unhandled promise rejection.'));
  console.log("ERROR: Unhandled rejection: " + (e.error && e.error.message ? e.error.message : e.error));
  console.log(JSON.stringify(e));
  return false;
});
let globalParams = {};
let showDebug = true;
let domLoaded = false; // Don't redirect console unless debug view is enabled (will require refresh if #debug added)

let redirected = false;

function redirect() {
  if (!redirected) {
    (0, _util.redirectConsole)('#output');
    redirected = true;
  }

  if (domLoaded) {
    document.querySelector('body').classList.toggle('console', showDebug);
  }
}

(0, _util.watchParameters)(parametersChanged);

if (showDebug) {
  redirect();
} // Service Worker Registration


if (false && 'serviceWorker' in navigator) {
  // Wait until page is loaded
  window.addEventListener('load', async function () {
    try {
      // Load 'service-worker.js', must be in a top-level directory.
      const serviceWorkerFile = 'service-worker.js';
      const reg = await navigator.serviceWorker.register(serviceWorkerFile); // If service-worker.js changes...

      reg.onupdatefound = function () {
        const installing = reg.installing;

        installing.onstatechange = function () {
          switch (installing.state) {
            case 'installed':
              if (navigator.serviceWorker.controller) {
                console.log('SERVICEWORKER: New content available.');

                if (confirm('[ServiceWorker] Update available -- reload now?')) {
                  window.location.reload();
                }
              } else {
                console.log('SERVICEWORKER: Now available offline.');
              }

              break;

            case 'redundant':
              console.log('SERVICEWORKER: Installing worker was redundant.');
              break;
          }
        };
      };
    } catch (e) {
      console.log('SERVICEWORKER: Error during registration: ' + e);
    }
  });
} // Old appcache


if (window.applicationCache) {
  applicationCache.addEventListener('updateready', function () {
    if (confirm('[AppCache] Update available -- reload now?')) {
      window.location.reload();
    }
  });
}

function parametersChanged(params = globalParams) {
  globalParams = params;
  console.log('PARAMS: ' + JSON.stringify(params));
  if (typeof params.nodebug !== 'undefined') showDebug = false;
  if (typeof params.debug !== 'undefined') showDebug = true;

  if (showDebug) {
    redirect();
  } // Everything else here requires DOM


  if (!domLoaded) return; // ...
}

const frequency = 50;
let accelerometer = null;
let accelStarted = false;
let logger = [];

function accelData(e) {
  const time = Date.now();
  const line = `${time},${accelerometer.x},${accelerometer.y},${accelerometer.z}`;
  logger.push(line);
  console.log(line);
}

async function accelStart() {
  if (!accelerometer) {
    console.log('PERMISSION: Asking...');
    const permissionResult = await navigator.permissions.query({
      name: 'accelerometer'
    });

    if (permissionResult.state === 'granted') {
      console.log('PERMISSION: Granted');
      accelerometer = new Accelerometer({
        frequency
      });
      accelerometer.addEventListener('reading', accelData);
    } else if (permissionResult.state === 'prompt') {
      console.log('PERMISSION: Prompt');
    } else {
      console.log('PERMISSION: Unexpected state: ' + permissionResult.state);
    }
  }

  if (accelerometer) {
    logger = [];
    accelerometer.start();
    accelStarted = true;
  }
}

function accelStop() {
  accelerometer.stop();

  if (logger.length > 0) {
    const now = new Date().toISOString().replace(/[^0-9]/g, '');
    (0, _util.download)(`accel-${now}.csv`, logger.join('\r\n'));
    logger = [];
  }

  accelStarted = false;
}

window.addEventListener('DOMContentLoaded', async event => {
  domLoaded = true;
  document.querySelector('#go').addEventListener('click', async () => {
    //document.querySelector('body').classList.remove('completed');
    if (!accelStarted) {
      accelStart();
    } else {
      accelStop();
    }
  }); // Call again now the DOM is loaded

  parametersChanged();
});
},{"./util.mjs":"js/util.mjs"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "53828" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","js/main.mjs"], null)
//# sourceMappingURL=/main.351207a1.js.map