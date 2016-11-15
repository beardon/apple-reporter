'use strict';

const _ = require('lodash');
const streamToPromise = require('stream-to-promise');
const zlib = require('zlib');

const AppleReporterError = require('./errors').AppleReporterError;

// given a list of keys and an object, return an array of the values contained
// in the object in the order specified by keys
function getParams(keys = [], params = {}) {
    return _.reduce(
        keys,
        (memo, key) => (params[key] ? _.concat(memo, params[key]) : memo),
        []
    );
}

function gunzip(stream) {
    return streamToPromise(stream.pipe(zlib.createGunzip()))
        .then((buffer) => buffer.toString('utf8'));
}

function xmlErrorThrower(xml) {
    throw new AppleReporterError(xml.Error.Message[0], xml.Error.Code[0]);
}

function textErrorThrower(text) {
    throw new AppleReporterError(text);
}

module.exports = {
    getParams,
    gunzip,
    xmlErrorThrower,
    textErrorThrower
};
