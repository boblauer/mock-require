import OriginalModule = require('module')
import { dirname, join, resolve } from 'path'
import * as callerId from 'caller-id'

const Module = OriginalModule as typeof OriginalModule & {
  _load: (request: string, parent: NodeModule) => NodeModule
  globalPaths: string[]
  _resolveFilename: (filename: string) => string
}

const originalLoader = Module._load
let mockExports = {} as { [path: string]: NodeModule["exports"] }
let pendingMockExports = {} as { [path: string]: NodeModule["exports"] }

Module._load = function (request, parent) {
  const fullFilePath = getFullPath(request, parent.filename);

  if (pendingMockExports.hasOwnProperty(fullFilePath)){
    mockExports[fullFilePath] = typeof pendingMockExports[fullFilePath] === 'string' ?
        require(pendingMockExports[fullFilePath]) :
        pendingMockExports[fullFilePath];

    delete pendingMockExports[fullFilePath];
  }

  return mockExports.hasOwnProperty(fullFilePath)
    ? mockExports[fullFilePath]
    : originalLoader.apply(this, arguments);
};

module.exports = (path: string, mockExport: NodeModule["exports"]) => {
  const calledFrom = callerId.getData().filePath;

  if (typeof mockExport === 'string') {
    mockExport = getFullPath(mockExport, calledFrom);
  }

  pendingMockExports[getFullPath(path, calledFrom)] = mockExport;
}

const stop = (path: string) => {
  const calledFrom = callerId.getData().filePath;
  const fullPath = getFullPath(path, calledFrom);
  delete pendingMockExports[fullPath];
  delete mockExports[fullPath];
}

const stopAll = () => {
  mockExports = {};
  pendingMockExports = {};
}

const reRequire = (path: string) => {
  const module = getFullPath(path, callerId.getData().filePath);
  delete require.cache[require.resolve(module)];
  return require(module);
}

const isInNodePath = (resolvedPath: string) => {
  if (!resolvedPath) return false;

  return Module.globalPaths
    .map((nodePath) => {
      return resolve(process.cwd(), nodePath) + '/';
    })
    .some((fullNodePath) => {
      return resolvedPath.indexOf(fullNodePath) === 0;
    });
}

const getFullPath = (path: string, calledFrom: string) => {
  let resolvedPath;
  const isLocalModule = /^\.{1,2}[/\\]?/.test(path);

  try {
    resolvedPath = require.resolve(path);
  } catch(e) { }

  if (resolvedPath !== undefined) {
    const isInPath = isInNodePath(resolvedPath);
    const isExternal = !isLocalModule && /[/\\]node_modules[/\\]/.test(resolvedPath);
    const isSystemModule = resolvedPath === path;

    if (isExternal || isSystemModule || isInPath) {
      return resolvedPath;
    }
  }

  if (!isLocalModule) {
    return path;
  }

  const localModuleName = join(dirname(calledFrom), path);
  try {
    return Module._resolveFilename(localModuleName);
  } catch (e) {
    if (isModuleNotFoundError(e)) { return localModuleName; }
    else { throw e; }
  }
}

const isModuleNotFoundError = (e: NodeJS.ErrnoException) => {
  return e.code && e.code === 'MODULE_NOT_FOUND'
}

module.exports.stop = stop
module.exports.stopAll = stopAll
module.exports.reRequire = reRequire