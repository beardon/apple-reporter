'use strict';

const chai = require('chai');
const sinon = require('sinon');
const zlib = require('zlib');

chai.use(require('chai-as-promised'));

const expect = chai.expect;

const AppleReporterError = require('../lib/errors').AppleReporterError;
const Reporter = require('../lib/index');

const userid = 'gy';
const accesstoken = 'itunesconnect-access-token';
const password = 'itunesconnect-account-password';

describe('Reporter', function () {
    const reporter = new Reporter({ userid, accesstoken });

    it('should correctly set config defaults', function () {
        expect(reporter).to.have.property('config');
        expect(reporter.config).to.have.property('baseUrl', 'https://reportingitc-reporter.apple.com/reportservice');
        expect(reporter.config).to.have.property('financeUrl', '/finance/v1');
        expect(reporter.config).to.have.property('mode', 'Robot.XML');
        expect(reporter.config).to.have.property('salesUrl', '/sales/v1');
        expect(reporter.config).to.have.property('version', '1.0');
        expect(reporter.config).to.have.property('tokenOptions');
        expect(reporter.config.tokenOptions).to.have.property('forceRetrieve', false);
        expect(reporter.config.tokenOptions).to.have.property('generateNewIfNeeded', false);
    });

    describe('getVersion', function () {
        it('should correctly report the version', function () {
            expect(reporter.getVersion()).to.eventually.equal('1.0');
        });
    });

    describe('fetch', function () {
        it('should have the correct arguments', sinon.test(function () {
            const fetchStub = this.stub(global, 'fetch', () => Promise.resolve);
            const handleFetchResponseStub = this.stub(Reporter, 'handleFetchResponse', () => Promise.resolve);

            const request = reporter.Sales.getReport({
                vendorNumber: 123456,
                reportType: 'Sales',
                reportSubType: 'Summary',
                dateType: 'Weekly',
                date: '20150208'
            }).catch(() => null);

            expect(fetchStub.firstCall.args).to.deep.equal([
                'https://reportingitc-reporter.apple.com/reportservice/sales/v1',
                {
                    method: 'POST',
                    body: 'jsonRequest={"userid":"gy","version":"1.0","mode":"Robot.XML","queryInput":"[p=Reporter.properties, Sales.getReport, 123456,Sales,Summary,Weekly,20150208]","accesstoken":"itunesconnect-access-token"}',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            ]);
        }));
    });

    describe('_handleFetchResponse', function () {
        describe('Robot.XML mode', function () {
            it('should handle simple valid basic text response', function () {
                expect(Reporter.handleFetchResponse('Robot.XML', {
                    ok: true,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('hello'),
                })).to.eventually.equal('hello');
            });

            it('should handle simple valid basic xml response', function () {
                expect(Reporter.handleFetchResponse('Robot.XML', {
                    ok: true,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello>world</hello>'),
                })).to.eventually.deep.equal({ hello: 'world' });
            });

            it('should handle gzipped valid text response', function () {
                expect(Reporter.handleFetchResponse('Robot.XML', {
                    ok: true,
                    headers: new fetch.Headers({ 'content-encoding': 'agzip' }),
                    body: zlib.createGzip('hello'),
                })).to.eventually.equal('hello');
            });

            it('should handle gzipped valid xml response', function () {
                expect(Reporter.handleFetchResponse('Robot.XML', {
                    ok: true,
                    headers: new fetch.Headers({ 'content-encoding': 'agzip' }),
                    body: zlib.createGzip('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello>world</hello>'),
                })).to.eventually.deep.equal({ hello: 'world' });
            });

            it('should handle simple invalid basic text response', function () {
                return Reporter.handleFetchResponse('Robot.XML', {
                    ok: false,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('hello'),
                })
                .catch((err) => {
                    expect(err).to.have.property('code', '-1');
                    expect(err).to.have.property('message', 'hello');
                    expect(err).to.be.instanceOf(AppleReporterError);
                });
            });

            it('should handle simple invalid basic xml response', function () {
                return Reporter.handleFetchResponse('Robot.XML', {
                    ok: false,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Error><Code>108</Code><Message>Invalid username and password. Change values and try again.</Message></Error>'),
                })
                .catch((err) => {
                    expect(err).to.have.property('code', '108');
                    expect(err).to.have.property('message', 'Invalid username and password. Change values and try again.');
                    expect(err).to.be.instanceOf(AppleReporterError);
                });
            });
        });

        describe('Normal mode', function () {
            it('should handle simple valid basic text response', function () {
                expect(Reporter.handleFetchResponse('Normal', {
                    ok: true,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('hello'),
                })).to.eventually.equal('hello');
            });

            it('should handle simple valid basic xml response', function () {
                expect(Reporter.handleFetchResponse('Normal', {
                    ok: true,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello>world</hello>'),
                })).to.eventually.equal('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello>world</hello>');
            });

            it('should handle gzipped valid text response', function () {
                expect(Reporter.handleFetchResponse('Normal', {
                    ok: true,
                    headers: new fetch.Headers({ 'content-encoding': 'agzip' }),
                    body: zlib.createGzip('hello'),
                })).to.eventually.equal('hello');
            });

            it('should handle gzipped valid xml response', function () {
                expect(Reporter.handleFetchResponse('Normal', {
                    ok: true,
                    headers: new fetch.Headers({ 'content-encoding': 'agzip' }),
                    body: zlib.createGzip('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello>world</hello>'),
                })).to.eventually.equal('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hello>world</hello>');
            });

            it('should handle simple invalid basic text response', function () {
                return Reporter.handleFetchResponse('Normal', {
                    ok: false,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('hello'),
                })
                .catch((err) => {
                    expect(err).to.have.property('code', '-1');
                    expect(err).to.have.property('message', 'hello');
                    expect(err).to.be.instanceOf(AppleReporterError);
                });
            });

            it('should handle simple invalid basic xml response', function () {
                return Reporter.handleFetchResponse('Normal', {
                    ok: false,
                    headers: new fetch.Headers(),
                    text: () => Promise.resolve('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Error><Code>108</Code><Message>Invalid username and password. Change values and try again.</Message></Error>'),
                })
                .catch((err) => {
                    expect(err).to.have.property('code', '-1');
                    expect(err).to.have.property('message', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Error><Code>108</Code><Message>Invalid username and password. Change values and try again.</Message></Error>');
                    expect(err).to.be.instanceOf(AppleReporterError);
                });
            });
        });
    });

    describe('Sales', function () {
        it('should have a the Sales API', function () {
            expect(reporter).to.have.property('Sales');
            expect(reporter.Sales).to.be.an('object');
            expect(reporter.Sales.getAccounts).to.be.a('function');
            expect(reporter.Sales.getStatus).to.be.a('function');
            expect(reporter.Sales.getVendors).to.be.a('function');
            expect(reporter.Sales.getReport).to.be.a('function');
            expect(reporter.Sales.getVersion).to.be.a('function');
        });

        describe('getAccounts', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Sales.getAccounts();

                expect(stub.firstCall.args).to.eql(['/sales/v1', 'Sales.getAccounts', { account: undefined }]);
            }));
        });

        describe('getStatus', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Sales.getStatus();

                expect(stub.firstCall.args).to.eql(['/sales/v1', 'Sales.getStatus', { account: undefined }]);
            }));
        });

        describe('getVendors', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Sales.getVendors();

                expect(stub.firstCall.args).to.eql(['/sales/v1', 'Sales.getVendors', { account: undefined }]);
            }));
        });

        describe('getReport', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Sales.getReport({
                    vendorNumber: 123456,
                    reportType: 'Sales',
                    reportSubType: 'Summary',
                    dateType: 'Weekly',
                    date: '20150208'
                });

                expect(stub.firstCall.args).to.eql(['/sales/v1', 'Sales.getReport, 123456,Sales,Summary,Weekly,20150208', { account: undefined }]);
            }));
        });

        describe('getVersion', function () {
            it('should correctly report the version', function () {
                expect(reporter.Sales.getVersion()).to.eventually.equal('1.0');
            });
        });
    });

    describe('Finance', function () {
        it('should have a the Finance API', function () {
            expect(reporter).to.have.property('Finance');
            expect(reporter.Finance).to.be.an('object');
            expect(reporter.Finance.getAccounts).to.be.a('function');
            expect(reporter.Finance.getStatus).to.be.a('function');
            expect(reporter.Finance.getVendorsAndRegions).to.be.a('function');
            expect(reporter.Finance.getReport).to.be.a('function');
            expect(reporter.Finance.getVersion).to.be.a('function');
        });

        describe('getAccounts', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Finance.getAccounts();

                expect(stub.firstCall.args).to.eql(['/finance/v1', 'Finance.getAccounts', { account: undefined }]);
            }));
        });

        describe('getStatus', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Finance.getStatus();

                expect(stub.firstCall.args).to.eql(['/finance/v1', 'Finance.getStatus', { account: undefined }]);
            }));
        });

        describe('getVendorsAndRegions', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Finance.getVendorsAndRegions({}, { account: 654321 });

                expect(stub.firstCall.args).to.eql(['/finance/v1', 'Finance.getVendorsAndRegions', { account: 654321 }]);
            }));
        });

        describe('getReport', function () {
            it('should have correct parameters', sinon.test(function () {
                const stub = this.stub(reporter, 'fetch');

                const request = reporter.Finance.getReport({
                    vendorNumber: 123456,
                    regionCode: 'US',
                    reportType: 'Financial',
                    fiscalYear: '2015',
                    fiscalPeriod: '02'
                });

                expect(stub.firstCall.args).to.eql(['/finance/v1', 'Finance.getReport, 123456,US,Financial,2015,02', { account: undefined }]);
            }));
        });

        describe('getVersion', function () {
            it('should correctly report the version', function () {
                expect(reporter.Finance.getVersion()).to.eventually.equal('1.0');
            });
        });
    });

    it('should have retrieveAccessToken', function () {
        expect(reporter.retrieveAccessToken).to.be.a('function');
    });

    const reporterWithNoAuth = new Reporter({ userid });
    const reporterWithPassword = new Reporter({ userid, password });
    const reporterWithToken = new Reporter({ userid, accesstoken });

    describe('retrieveAccessToken', function () {

        it('should throw if no password or access code supplied', function () {
            expect(() => reporterWithNoAuth.retrieveAccessToken()).to.throw();
        });

        it('should not throw if access token already supplied', function () {
            expect(() => reporterWithToken.retrieveAccessToken()).to.not.throw();
        });

        it('should throw if forceRetrieve is set but not password was supplied', function () {
            expect(() => reporterWithToken.retrieveAccessToken({ forceRetrieve: true })).to.throw();
        });

        // TODO: Test the actual behavior

    });
});
