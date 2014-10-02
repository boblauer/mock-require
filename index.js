var Module           = require('module')
  , originalLoader   = Module._load
  , intercept        = {}
  , stopIntercepting = {}
  ;

Module._load = function(request, parent) {
  var fullFilePath = Module._resolveFilename(request, parent);

  if (stopIntercepting[request] || stopIntercepting[fullFilePath]) {
    delete intercept[request];
    delete intercept[fullFilePath];
    delete stopIntercepting[request];
    delete stopIntercepting[fullFilePath];
  }

  if (!intercept.hasOwnProperty(fullFilePath) && !intercept.hasOwnProperty(request)) {
    return originalLoader.apply(this, arguments);
  }

  if (intercept.hasOwnProperty(request) && !intercept.hasOwnProperty(fullFilePath)) {
    intercept[fullFilePath] = intercept[request];
    delete intercept[request];
  }

  return intercept[fullFilePath];
};

function startMocking(path, mock) {
  if (typeof mock === 'string') {
    mock = require(mock);
  }

  intercept[path] = mock;
}

function stopMocking(path) {
  stopIntercepting[path] = true;
}

module.exports = {
  mock: startMocking,
  revert: stopMocking
};
