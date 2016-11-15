'use strict';

const expect = require('chai').expect;

const AppleReporterError = require('../lib/errors').AppleReporterError;
const util = require('../lib/util');

describe('Util', function () {
    describe('getParams', function () {
        it('should sort keys and insert values correctly', function () {
            const params = util.getParams(['a', 'b', 'c', 'd'], { b: 2, a: 1, c: 3, e: 5 });

            expect(params).to.deep.equal([1, 2, 3]);
        });
    });

    describe('xmlErrorThrower', function () {
        it('should throw an error given an Apple reporter XML error structure', function () {
            const xml = {
                Error: {
                    Message: ['Invalid app or command format.'],
                    Code: ['100']
                }
            };

            const thrower = () => util.xmlErrorThrower(xml);
            let err;
            try {
                thrower();
            }
            catch (e) {
                err = e;
            }

            expect(thrower).to.throw(AppleReporterError);
            expect(err).to.have.property('message', 'Invalid app or command format.');
            expect(err).to.have.property('code', '100');
        });
    });

    describe('textErrorThrower', function () {
        it('should throw an error given an Apple reporter text error message', function () {
            const thrower = () => util.textErrorThrower('Invalid app or command format.');
            let err;
            try {
                thrower();
            }
            catch (e) {
                err = e;
            }

            expect(thrower).to.throw(AppleReporterError);
            expect(err).to.have.property('message', 'Invalid app or command format.');
            expect(err).to.have.property('code', '-1');
        });
    });
});