var Module           = require('module')
  , dirname          = require('path').dirname
  , join             = require('path').join
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
  if (typeof mockExport === 'string') {
    mockExport = require(getFullPath(mockExport));
  }

  intercept[getFullPath(path)] = mockExport;
}

function stopMocking(path) {
  delete intercept[getFullPath(path)];
}

function getFullPath(path) {
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
    path = join(dirname(getCallingFile(path)), path);
    path = Module._resolveFilename(path);
  }

  return path;
}

function getCallingFile() {
  var origPrepareStackTrace = Error.prepareStackTrace
    , fileName
    , stack
    ;

  Error.prepareStackTrace = function (_, stack) { return stack; };
  stack = new Error().stack;
  Error.prepareStackTrace = origPrepareStackTrace;

  while (!fileName && stack.length) {
    fileName = stack.shift().receiver.filename;
  }

  return fileName;
}

module.exports = startMocking;
module.exports.stop = stopMocking;
