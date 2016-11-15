'use strict';

const expect = require('chai').expect;

const AppleReporterError = require('../lib/errors').AppleReporterError;

describe('Errors', function () {
    it('should be an error', function () {
        const err = new AppleReporterError('test');

        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property('message', 'test');
        expect(err).to.have.property('code', '-1');
    });

    it('should handle code', function () {
        const err = new AppleReporterError('test', 5);

        expect(err).to.be.an.instanceof(Error);
        expect(err).to.have.property('message', 'test');
        expect(err).to.have.property('code', '5');
    });
});