'use strict';

var a = require('./module-a');

module.exports = {
  id: 'local-module-b',
  dependentOn: a,
};
