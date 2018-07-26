'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const xml2js = require('xml2js');

const fetch = require('./fetch');
const util = require('./util');

const AppleReporterError = require('./errors').AppleReporterError;

Promise.promisifyAll(xml2js);

const errorMessages = {
    passwordRequired: 'Retrieving the access token requires the account password, but no password was supplied',
    accessTokenRequired: 'This method requires an access token, but no access token was supplied and retrieveAccessToken() was not called',
    needsNewAccessToken: 'Access token doesn\'t exist or is expired, pass { generateNewIfNeeded: true } to force generation of a new token',
    accessTokenSupplied: 'retrieveAccessToken() was called, but an access token was supplied at creation'
};

class Sales {
    constructor(context) {
        function create(type, keys) {
            return (params) => context.fetch(
                context.config.salesUrl,
                _.compact(_.concat(`Sales.${type}`, util.getParams(keys, params).join(','))).join(', ')
            );
        }

        this.getAccounts = create('getAccounts');
        this.getReport = create('getReport', ['vendorNumber', 'reportType', 'reportSubType', 'dateType', 'date', 'reportVersion']);
        this.getStatus = create('getStatus');
        this.getVendors = create('getVendors');
        this.getVersion = _.bind(context.getVersion, context);
    }
}

class Finance {
    constructor(context) {
        function create(type, keys) {
            return (params) => context.fetch(
                context.config.financeUrl,
                _.compact(_.concat(`Finance.${type}`, util.getParams(keys, params).join(','))).join(', ')
            );
        }

        this.getAccounts = create('getAccounts');
        this.getReport = create('getReport', ['vendorNumber', 'regionCode', 'reportType', 'fiscalYear', 'fiscalPeriod']);
        this.getStatus = create('getStatus');
        this.getVendorsAndRegions = create('getVendorsAndRegions');
        this.getVersion = _.bind(context.getVersion, context);
    }
}

class Reporter {
    constructor(config) {
        this.config = _.defaultsDeep(config, {
            baseUrl: 'https://reportingitc-reporter.apple.com/reportservice',
            financeUrl: '/finance/v1',
            mode: 'Robot.XML',
            salesUrl: '/sales/v1',
            version: '1.0',
            tokenOptions: {
                forceRetrieve: false,
                generateNewIfNeeded: false
            }
        });

        this.Sales = new Sales(this);
        this.Finance = new Finance(this);
    }

    fetchRaw(serviceUrl, params, usePassword = false) {
        return Promise.try(() => {
            const url = `${this.config.baseUrl}${serviceUrl}`;

            const data = {
                userid: this.config.userid,
                account: this.config.account,
                version: this.config.version,
                mode: this.config.mode,
                queryInput: `[p=Reporter.properties, ${params}]`
            };

            if (usePassword && this.config.password == null) throw new AppleReporterError(errorMessages.passwordRequired);
            if (!usePassword && this.config.accesstoken == null) throw new AppleReporterError(errorMessages.accessTokenRequired);

            if (usePassword) {
                data.password = this.config.password;
            }
            else {
                data.accesstoken = this.config.accesstoken;
            }

            const method = 'POST';

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const body = `jsonRequest=${JSON.stringify(data)}`;

            return fetch(url, { method, body, headers });
        });
    }

    fetch(serviceUrl, params, usePassword = false) {
        return this.fetchRaw(serviceUrl, params, usePassword).then((response) => Reporter.handleFetchResponse(this.config.mode, response));
    }

    retrieveAccessToken(customOptions = null) {
        const options = _.merge(this.config.tokenOptions, customOptions);

        if (this.config.accesstoken != null) {
            // If we've already retrieved the access token (or one was given), skip retrieval
            // unless the user specifically asks to force retrieval
            if (options.forceRetrieve == null || !options.forceRetrieve) {
                return Promise.resolve({ token: this.config.accesstoken, isNew: false });
            }
        }

        // If we get here and we don't have a password, that's a problem
        if (this.config.password == null) throw new AppleReporterError(errorMessages.passwordRequired);

        let newTokenWasGenerated = false;

        return this.fetch(this.config.salesUrl, '[Sales.viewToken]', true)
        .then((result) => {
            if (result.ViewToken.Message != null) return null;

            const expDate = new Date(result.ViewToken.ExpirationDate[0]);
            const accessToken = result.ViewToken.AccessToken[0];

            if (new Date() < expDate) return accessToken;
            return null;
        })
        .then((maybeAccessToken) => {
            // If it was retrieved and not expired, return it
            if (maybeAccessToken != null) return maybeAccessToken;

            // Otherwise, we need to generate one, but only if generateNewIfNeeded is set
            if (options.generateNewIfNeeded == null || !options.generateNewIfNeeded) throw new AppleReporterError(errorMessages.needsNewAccessToken);

            newTokenWasGenerated = true;

            const url = this.config.salesUrl; // Doesn't matter
            const params = '[Sales.generateToken]';

            return this.fetchRaw(url, params, true)
            .then((intermediateResponse) => {
                // To complete this kind of request, we have to make another request with some
                // particular URL params, referencing the service request id passed in these response headers
                const requestId = intermediateResponse.headers.service_request_id;
                // Do a regular fetch so the result will get parsed
                return this.fetchRaw(`${url}?isExistingToken=Y&requestId=${requestId}`, params, true);
            })
            .then((response) => Reporter.handleFetchResponse(this.config.mode, response))
            .then((accessTokenResponse) => accessTokenResponse.ViewToken.AccessToken[0]);
        })
        .then((accessToken) => {
            this.config.accesstoken = accessToken;
            return { token: accessToken, isNew: newTokenWasGenerated };
        });
    }

    getVersion() {
        return Promise.resolve(this.config.version);
    }
}

Reporter.handleFetchResponse = (mode, response) => (
    Promise.try(() => {
        if (response.ok) {
            if (response.headers.get('content-encoding') === 'agzip') {
                return util.gunzip(response.body);
            }

            return response.text();
        }

        if (mode === 'Robot.XML') {
            const textPromise = response.text();
            return textPromise
                .then(xml2js.parseStringAsync)
                .then(util.xmlErrorThrower, () => textPromise.then(util.textErrorThrower));
        }

        return response.text().then(util.textErrorThrower);
    })
    .then((text) => {
        if (mode === 'Robot.XML') {
            return xml2js.parseStringAsync(text).catchReturn(text);
        }

        return text;
    })
);


module.exports = Reporter;
