var Module           = require('module')
  , dirname          = require('path').dirname
  , join             = require('path').join
  , callerId         = require('caller-id')
  , originalLoader   = Module._load
  , intercept        = {}
  ;

Module._load = function(request, parent) {
  var fullFilePath = getFullPath(request, parent.filename);

  return intercept.hasOwnProperty(fullFilePath)
    ? intercept[fullFilePath]
    : originalLoader.apply(this, arguments);
};

function startMocking(path, mockExport) {
  var calledFrom = callerId.getData().filePath;

  if (typeof mockExport === 'string') {
    mockExport = require(getFullPath(mockExport, calledFrom));
  }

  intercept[getFullPath(path, calledFrom)] = mockExport;
}

function stopMocking(path) {
  var calledFrom = callerId.getData().filePath;
  delete intercept[getFullPath(path, calledFrom)];
}

function stopMockingAll() {
  intercept = {};
}

function reRequire(path) {
  var module = getFullPath(path, callerId.getData().filePath);
  delete require.cache[require.resolve(module)];
  return require(module);
}

function getFullPath(path, calledFrom) {
  var resolvedPath;
  try {
    resolvedPath = require.resolve(path);
  } catch(e) { }

  var isExternal = /[/\\]node_modules[/\\]/.test(resolvedPath);
  var isSystemModule = resolvedPath === path;
  if (isExternal || isSystemModule) {
    return resolvedPath;
  }

  var isLocalModule = /^\.{1,2}[/\\]/.test(path);
  if (!isLocalModule) {
    return path;
  }

  var localModuleName = join(dirname(calledFrom), path);
  try {
    return Module._resolveFilename(localModuleName);
  } catch (e) {
    if (isModuleNotFoundError(e)) { return localModuleName; }
    else { throw e; }
  }
}

function isModuleNotFoundError(e){
  return e.code && e.code === 'MODULE_NOT_FOUND'
}

module.exports = startMocking;
module.exports.stop = stopMocking;
module.exports.stopAll = stopMockingAll;
module.exports.reRequire = reRequire;
