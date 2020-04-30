'use strict';

var assert = require('assert');
var normalize = require('normalize-path');
var mock = require('..');

describe('Mock Require', function () {
  afterEach(function () {
    mock.stopAll();
  });

  it('should mock a required function', function () {
    mock('./exported-fn', function () {
      return 'mocked fn';
    });

    assert.equal(require('./exported-fn')(), 'mocked fn');
  });

  it('should mock a required object', function () {
    mock('./exported-obj', {
      mocked: true,
      fn: function () {
        return 'mocked obj';
      },
    });

    var obj = require('./exported-obj');
    assert.equal(obj.fn(), 'mocked obj');
    assert.equal(obj.mocked, true);

    mock.stop('./exported-obj');

    obj = require('./exported-obj');
    assert.equal(obj.fn(), 'exported object');
    assert.equal(obj.mocked, false);
  });

  it('should unmock', function () {
    mock('./exported-fn', function () {
      return 'mocked fn';
    });

    mock.stop('./exported-fn');

    var fn = require('./exported-fn');
    assert.equal(fn(), 'exported function');
  });

  it('should mock a root file', function () {
    mock('.', { mocked: true });
    assert.equal(require('.').mocked, true);
  });

  it('should mock a standard lib', function () {
    mock('fs', { mocked: true });

    var fs = require('fs');
    assert.equal(fs.mocked, true);
  });

  it('should mock an external lib', function () {
    mock('mocha', { mocked: true });

    var mocha = require('mocha');
    assert.equal(mocha.mocked, true);
  });

  it('should one lib with another', function () {
    mock('fs', 'path');
    assert.equal(require('fs'), require('path'));

    mock('./exported-fn', './exported-obj');
    assert.equal(require('./exported-fn'), require('./exported-obj'));
  });

  it('should support re-requiring', function () {
    assert.equal(mock.reRequire('.'), 'root');
  });

  it('should cascade mocks', function () {
    mock('path', { mocked: true });
    mock('fs', 'path');

    var fs = require('fs');
    assert.equal(fs.mocked, true);
  });

  it('should never require the real lib when mocking it', function () {
    mock('./throw-exception', {});
    require('./throw-exception');
  });

  it('should mock libs required elsewhere', function () {
    mock('./throw-exception', {});
    require('./throw-exception-runner');
  });

  it('should only load the mocked lib when it is required', function () {
    mock('./throw-exception', './throw-exception-when-required');
    try {
      require('./throw-exception-runner');
      throw new Error('this line should never be executed.');
    } catch (error) {
      assert.equal(error.message, 'this should run when required');
    }
  });

  it('should stop all mocks', function () {
    mock('fs', {});
    mock('path', {});
    var fsMock = require('fs');
    var pathMock = require('path');

    mock.stopAll();

    assert.notEqual(require('fs'), fsMock);
    assert.notEqual(require('path'), pathMock);
  });

  it('should mock a module that does not exist', function () {
    mock('a', { id: 'a' });

    assert.equal(require('a').id, 'a');
  });

  it('should mock multiple modules that do not exist', function () {
    mock('a', { id: 'a' });
    mock('b', { id: 'b' });
    mock('c', { id: 'c' });

    assert.equal(require('a').id, 'a');
    assert.equal(require('b').id, 'b');
    assert.equal(require('c').id, 'c');
  });

  it('should mock a local file that does not exist', function () {
    mock('./a', { id: 'a' });
    assert.equal(require('./a').id, 'a');

    mock('../a', { id: 'a' });
    assert.equal(require('../a').id, 'a');
  });

  it('should mock a local file required elsewhere', function () {
    mock('./x', { id: 'x' });
    assert.equal(require('./nested/module-c').dependentOn.id, 'x');
  });

  it('should mock multiple local files that do not exist', function () {
    mock('./a', { id: 'a' });
    mock('./b', { id: 'b' });
    mock('./c', { id: 'c' });

    assert.equal(require('./a').id, 'a');
    assert.equal(require('./b').id, 'b');
    assert.equal(require('./c').id, 'c');
  });

  it('should unmock a module that is not found', function () {
    var moduleName = 'module-that-is-not-installed';

    mock(moduleName, { mocked: true });
    mock.stop(moduleName);

    try {
      require(moduleName);
      throw new Error('this line should never be executed.');
    } catch (e) {
      assert.equal(e.code, 'MODULE_NOT_FOUND');
    }
  });

  it('should differentiate between local files and external modules with the same name', function () {
    mock('module-a', { id: 'external-module-a' });

    var b = require('./module-b');

    assert.equal(b.dependentOn.id, 'local-module-a');
    assert.equal(b.dependentOn.dependentOn.id, 'external-module-a');
  });

  it('should mock files in the node path by the full path', function () {
    assert.equal(normalize(process.env.NODE_PATH), 'test/node-path');

    mock('in-node-path', { id: 'in-node-path' });

    var b = require('in-node-path');
    var c = require('./node-path/in-node-path');

    assert.equal(b.id, 'in-node-path');
    assert.equal(c.id, 'in-node-path');

    assert.equal(b, c);
  });
});
