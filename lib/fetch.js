'use strict';

const fetch = require('node-fetch');
const Promise = require('bluebird');

fetch.Promise = Promise;

const isInTest = typeof global.it === 'function';

if (isInTest) {
    global.fetch = fetch;
    module.exports = (...args) => global.fetch(...args);
}
else {
    module.exports = fetch;
}
