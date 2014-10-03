var assert  = require('assert')
  , mock    = require('../index')
  ;

(function shouldMockAndUnmock() {
  mock('./exported-fn', function() {
    return 'mocked fn';
  });

  mock.stop('./exported-fn');

  var fn = require('./exported-fn');
  assert.equal(fn(), 'exported function');
})();

(function shouldMockRequiredFn() {
  mock('./exported-fn', function() {
    return 'mocked fn';
  });

  var fn = require('./exported-fn');
  assert.equal(fn(), 'mocked fn');

  mock.stop('./exported-fn');

  fn = require('./exported-fn');
  assert.equal(fn(), 'exported function');
})();

(function shouldMockRequiredObj() {
  mock('./exported-obj', {
    mocked: true,
    fn: function() {
      return 'mocked obj';
    }
  });

  var obj = require('./exported-obj');
  assert.equal(obj.fn(), 'mocked obj');
  assert.equal(obj.mocked, true);

  mock.stop('./exported-obj');

  obj = require('./exported-obj');
  assert.equal(obj.fn(), 'exported object');
  assert.equal(obj.mocked, false);
})();

(function shouldMockStandardLibs() {
  mock('fs', { mocked: true });

  var fs = require('fs');
  assert.equal(fs.mocked, true);
})();

(function shouldMockExternalLibs() {
  mock('caller-id', { mocked: true });

  var callerId = require('caller-id');
  assert.equal(callerId.mocked, true);
  mock.stop('caller-id');
})();

(function shouldRequireMockedLib() {
  mock('fs', 'path');

  assert.equal(require('fs'), require('path'));
  mock.stop('fs');

  mock('./exported-fn', './exported-obj');
  assert.equal(require('./exported-fn'), require('./exported-obj'));
  mock.stop('./exported-fn');
})();

(function mocksShouldCascade() {
  mock('path', { mocked: true });
  mock('fs', 'path');

  var fs = require('fs');
  assert.equal(fs.mocked, true);
  mock.stop('fs');
  mock.stop('path');
})();

(function mocksShouldNeverRequireTheOriginal() {
  mock('./throw-exception', {});
  require('./throw-exception');
  mock.stop('./throw-exception');
})();

(function mocksShouldWorkWhenRequiredFromOtherFile() {
  mock('./throw-exception', {});
  require('./throw-exception-runner');
  mock.stop('./throw-exception');
})();

console.log('All tests pass!');
