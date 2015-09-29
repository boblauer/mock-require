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

function getFullPath(path, calledFrom) {
  var resolvedPath;
  try {
    resolvedPath = require.resolve(path);
  } catch(e) { }

  var isExternal = /[/\\]{1}node_modules[/\\]{1}/.test(resolvedPath);
  var isSystemModule = resolvedPath === path;
  if (isExternal || isSystemModule) {
    return resolvedPath;
  }

  try {
    var localModuleName = join(dirname(calledFrom), path);
    return Module._resolveFilename(localModuleName);
  } catch (e) {
    if (isModuleNotFoundError(e)) { return path; }
    else { throw e; }
  }
}

function isModuleNotFoundError(e){
  return e.code && e.code === 'MODULE_NOT_FOUND'
}

module.exports = startMocking;
module.exports.stop = stopMocking;
module.exports.stopAll = stopMockingAll;
