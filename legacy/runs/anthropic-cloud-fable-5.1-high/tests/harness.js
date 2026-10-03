// A minimal test runner shared by the test files. Uses only Node built-ins.
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

// Runs the tests registered with test() and sets the exit code.
function run() {
  var failed = 0;
  tests.forEach(function (t) {
    try {
      t.fn();
      console.log('ok   - ' + t.name);
    } catch (err) {
      failed++;
      console.log('FAIL - ' + t.name);
      console.log(String(err.stack || err).replace(/^/gm, '       '));
    }
  });
  console.log('\n' + (tests.length - failed) + ' of ' + tests.length + ' tests passed.');
  process.exitCode = failed ? 1 : 0;
}

// Compiles the named files in js/, to be run unmodified in a fake browser
// global with script.runInContext().
function loadScripts(names) {
  return names.map(function (name) {
    var file = path.join(__dirname, '..', 'js', name);
    return new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  });
}

// An in-memory localStorage. Set failWrites to make setItem throw (quota
// exceeded), or disabled to make every call throw (storage turned off).
function makeStorage(initial) {
  var storage = {
    data: Object.assign({}, initial),
    failWrites: false,
    disabled: false,
    getItem: function (key) {
      if (storage.disabled) { throw new Error('SecurityError'); }
      return Object.prototype.hasOwnProperty.call(storage.data, key) ? storage.data[key] : null;
    },
    setItem: function (key, value) {
      if (storage.disabled || storage.failWrites) { throw new Error('QuotaExceededError'); }
      storage.data[key] = String(value);
    },
    removeItem: function (key) {
      if (storage.disabled) { throw new Error('SecurityError'); }
      delete storage.data[key];
    }
  };
  return storage;
}

// Runs the scripts (from loadScripts) as a freshly opened page (or tab) would,
// on the given storage. Returns the page's globals, plus fireStorageEvent(key)
// to tell the page that another tab changed what is stored under key.
function openPage(scripts, storage) {
  var storageListeners = [];
  var sandbox = {
    localStorage: storage,
    console: { warn: function () {}, error: function () {} },
    addEventListener: function (type, listener) {
      if (type === 'storage') { storageListeners.push(listener); }
    },
    fireStorageEvent: function (key) {
      storageListeners.forEach(function (listener) { listener({ key: key }); });
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  scripts.forEach(function (script) { script.runInContext(sandbox); });
  return sandbox;
}

module.exports = {
  test: test,
  run: run,
  loadScripts: loadScripts,
  makeStorage: makeStorage,
  openPage: openPage
};
