#mock-require

####Simple, intuitive mocking of Node.js modules.

[![Build Status](https://travis-ci.org/boblauer/mock-require.svg)](https://travis-ci.org/boblauer/mock-require)

##About

mock-require is useful if you want to mock `require` statements in Node.js.  I wrote it because I wanted something with a straight-forward API that would let me mock anything, from a single exported function to a standard library.

##Usage

```javascript
var mock = require('mock-require');

mock('http', { request: function() {
  console.log('http.request called');
}});

var http = require('http');
http.request(); // 'http.request called'
```
##API
```javascript
mock(path, mockExport)
```

__path__: `String`

The module you that you want to mock.  This is the same string you would pass in if you wanted to `require` the module.

This path should be relative to the current file, just as it would be if you were to `require` the module from the current file.  mock-require is smart enough to mock this module everywhere it is required, even if it's required from a different file using a different relative path.

__mockExport__ : `object/function`

The function or object you want to be returned from `require`, instead of the `path` module's exports.

__mockExport__ : `string`

The module you want to be returned from `require`, instead of the `path` module's export.  This allows you to replace modules with other modules.  For example, if you wanted to replace the `fs` module with the `path` module (you probably wouldn't, but if you did):

```javascript
require('fs', 'path');
require('fs') === require('path'); // true
```
This is useful if you have a mock library that you want to use in multiple places.  For example:

`test/spy.js`:
```javascript
module.exports = function() {
    return 'this was mocked';
};
```

`test/a_spec.js`:
```javascript
var mock = require('mock-require');
mock('../some/dependency', './spy');
...
```

`test/b_spec.js`:
```javascript
var mock = require('mock-require');
mock('../some/other/dependency', './spy');
...
```
---
```javascript
mock.stop(path)
```
__path__: `String`

The module you that you want to stop mocking.  This is the same string you would pass in if you wanted to `require` the module.

This will only modify variables used after `mock.stop` is called.  For example:

```javascript
var mock = require('mock-require');
mock('fs', { mockedFS: true });

var fs1 = require('fs');

mock.stop('fs');

var fs2 = require('fs');

fs1 === fs2; // false
```

##Test
npm test
