var assert  = require('assert')
  , mock    = require('../index')
  ;

(function shouldMockRequiredFn() {
  mock('./requires/exported-fn', function() {
    return 'mocked fn';
  });

  var fn = require('./requires/exported-fn');
  assert.equal(fn(), 'mocked fn');

  mock.stop('./requires/exported-fn');

  fn = require('./requires/exported-fn');
  assert.equal(fn(), 'exported function');
})();

(function shouldMockRequiredObj() {
  mock('./requires/exported-obj', {
    mocked: true,
    fn: function() {
      return 'mocked obj';
    }
  });

  var obj = require('./requires/exported-obj');
  assert.equal(obj.fn(), 'mocked obj');
  assert.equal(obj.mocked, true);

  mock.stop('./requires/exported-obj');

  obj = require('./requires/exported-obj');
  assert.equal(obj.fn(), 'exported object');
  assert.equal(obj.mocked, false);
})();

(function shouldMockAndUnmock() {
  mock('./requires/exported-fn', function() {
    return 'mocked fn';
  });

  mock.stop('./requires/exported-fn');

  var fn = require('./requires/exported-fn');
  assert.equal(fn(), 'exported function');
})();

(function shouldMockStandardLibs() {
  mock('fs', { mocked: true });

  var fs = require('fs');
  assert.equal(fs.mocked, true);
})();

(function shouldRequireMockedLib() {
  mock('fs', 'path');

  assert.equal(require('fs'), require('path'));
})();

(function mocksShouldCascade() {
  mock('path', { mocked: true });
  mock('fs', 'path');

  var fs = require('fs');
  assert.equal(fs.mocked, true);
})();

console.log('All tests pass!');
