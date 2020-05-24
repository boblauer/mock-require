'use strict';

var Module = require('module');
var dirname = require('path').dirname;
var join = require('path').join;
var resolve = require('path').resolve;
var pathsep = require('path').sep;
var getCallerFile = require('get-caller-file');
var normalize = require('normalize-path');
var originalLoader = Module._load;

var mockExports = {};
var pendingMockExports = {};

Module._load = function (request, parent) {
  if (!parent) return originalLoader.apply(this, arguments);

  var fullFilePath = getFullPathNormalized(request, parent.filename);

  if (pendingMockExports.hasOwnProperty(fullFilePath)) {
    var pending = pendingMockExports[fullFilePath];
    var mockExport = pending.lazy ? pending.mockExport() : pending.mockExport;

    mockExports[fullFilePath] =
      typeof mockExport === 'string'
        ? require(getFullPathNormalized(mockExport, pending.calledFrom))
        : mockExport;

    delete pendingMockExports[fullFilePath];
  }

  return mockExports.hasOwnProperty(fullFilePath)
    ? mockExports[fullFilePath]
    : originalLoader.apply(this, arguments);
};

function startMocking(path, mockExport, lazy) {
  var calledFrom = getCallerFile();

  pendingMockExports[getFullPathNormalized(path, calledFrom)] = {
    mockExport: mockExport,
    calledFrom: calledFrom,
    lazy: lazy,
  };
}

function stopMocking(path) {
  var calledFrom = getCallerFile();
  var fullPath = getFullPathNormalized(path, calledFrom);
  delete pendingMockExports[fullPath];
  delete mockExports[fullPath];
}

function stopMockingAll() {
  mockExports = {};
  pendingMockExports = {};
}

function reRequire(path) {
  var module = getFullPathNormalized(path, getCallerFile());
  delete require.cache[require.resolve(module)];
  return require(module);
}

function isInNodePath(resolvedPath) {
  if (!resolvedPath) return false;

  return Module.globalPaths
    .map(function (nodePath) {
      return resolve(process.cwd(), nodePath) + pathsep;
    })
    .some(function (fullNodePath) {
      return resolvedPath.indexOf(fullNodePath) === 0;
    });
}

function getFullPath(path, calledFrom) {
  var resolvedPath;
  try {
    resolvedPath = require.resolve(path);
  } catch (e) {
    // do nothing
  }

  var isLocalModule = /^\.{1,2}[/\\]?/.test(path);
  var isInPath = isInNodePath(resolvedPath);
  var isExternal =
    !isLocalModule && /[/\\]node_modules[/\\]/.test(resolvedPath);
  var isSystemModule = resolvedPath === path;

  if (isExternal || isSystemModule || isInPath) {
    return resolvedPath;
  }

  if (!isLocalModule) {
    return path;
  }

  var localModuleName = join(dirname(calledFrom), path);
  try {
    return Module._resolveFilename(localModuleName);
  } catch (e) {
    if (isModuleNotFoundError(e)) {
      return localModuleName;
    } else {
      throw e;
    }
  }
}

function getFullPathNormalized(path, calledFrom) {
  return normalize(getFullPath(path, calledFrom));
}

function isModuleNotFoundError(e) {
  return e.code && e.code === 'MODULE_NOT_FOUND';
}

module.exports = startMocking;
module.exports.stop = stopMocking;
module.exports.stopAll = stopMockingAll;
module.exports.reRequire = reRequire;
