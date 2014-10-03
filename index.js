var Module           = require('module')
  , dirname          = require('path').dirname
  , join             = require('path').join
  , callerId         = require('caller-id')
  , originalLoader   = Module._load
  , intercept        = {}
  ;

Module._load = function(request, parent) {
  var fullFilePath = Module._resolveFilename(request, parent);

  if (!intercept.hasOwnProperty(fullFilePath)) {
    return originalLoader.apply(this, arguments);
  }

  return intercept[fullFilePath];
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

function getFullPath(path, calledFrom) {
  var needsFullPath = true
    , resolvedPath
    , isExternal
    ;

  try {
    resolvedPath = require.resolve(path);
    isExternal = resolvedPath.indexOf('/node_modules/') !== -1;

    needsFullPath = resolvedPath !== path && !isExternal;

    if (isExternal) {
      path = resolvedPath;
    }
  } catch(e) { }

  if (needsFullPath) {
    path = join(dirname(calledFrom), path);
    path = Module._resolveFilename(path);
  }

  return path;
}

module.exports = startMocking;
module.exports.stop = stopMocking;
