var assert      = require('assert')
  , mockRequire = require('../index')
  ;

(function shouldMockRequiredFn() {
  mockRequire.mock('./requires/exported-fn', function() {
    return 'mocked fn';
  });

  var fn = require('./requires/exported-fn');
  assert.equal(fn(), 'mocked fn');

  mockRequire.revert('./requires/exported-fn');

  fn = require('./requires/exported-fn');
  assert.equal(fn(), 'exported function');
})();

(function shouldMockRequiredObj() {
  mockRequire.mock('./requires/exported-obj', {
    mocked: true,
    fn: function() {
      return 'mocked obj';
    }
  });

  var obj = require('./requires/exported-obj');
  assert.equal(obj.fn(), 'mocked obj');
  assert.equal(obj.mocked, true);

  mockRequire.revert('./requires/exported-obj');

  obj = require('./requires/exported-obj');
  assert.equal(obj.fn(), 'exported object');
  assert.equal(obj.mocked, false);
})();

(function shouldMockAndUnmock() {
  mockRequire.mock('./requires/exported-fn', function() {
    return 'mocked fn';
  });

  mockRequire.revert('./requires/exported-fn');

  var fn = require('./requires/exported-fn');
  assert.equal(fn(), 'exported function');
})();

(function shouldMockStandardLibs() {
  mockRequire.mock('fs', { mocked: true });

  var fs = require('fs');
  assert.equal(fs.mocked, true);
})();

(function shouldRequireMockedLib() {
  mockRequire.mock('fs', 'path');

  assert.equal(require('fs'), require('path'));
})();

(function mocksShouldCascade() {
  mockRequire.mock('path', { mocked: true });
  mockRequire.mock('fs', 'path');

  var fs = require('fs');
  assert.equal(fs.mocked, true);
})();

console.log('All tests pass!');
