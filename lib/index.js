'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const xml2js = require('xml2js');

const fetch = require('./fetch');
const util = require('./util');

Promise.promisifyAll(xml2js);

class Sales {
    constructor(context) {
        function create(type, keys) {
            return (params) => context.fetch(
                context.config.salesUrl,
                _.compact(_.concat(`Sales.${type}`, util.getParams(keys, params).join(','))).join(', ')
            );
        }

        this.getAccounts = create('getAccounts');
        this.getReport = create('getReport', ['vendorNumber', 'reportType', 'reportSubType', 'dateType', 'date']);
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
        this.config = _.defaults(config, {
            baseUrl: 'https://reportingitc-reporter.apple.com/reportservice',
            financeUrl: '/finance/v1',
            mode: 'Robot.XML',
            salesUrl: '/sales/v1',
            version: '1.0'
        });

        this.Sales = new Sales(this);
        this.Finance = new Finance(this);
    }

    fetch(serviceUrl, params) {
        return Promise.try(() => {
            const url = `${this.config.baseUrl}${serviceUrl}`;

            const data = {
                userid: this.config.userid,
                accesstoken: this.config.accesstoken,
                account: this.config.account,
                version: this.config.version,
                mode: this.config.mode,
                queryInput: `[p=Reporter.properties, ${params}]`
            };

            const method = 'POST';

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const body = `jsonRequest=${JSON.stringify(data)}`;

            return fetch(url, { method, body, headers })
                .then((response) => Reporter.handleFetchResponse(this.config.mode, response));
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
            var text_promise = response.text()
            return text_promise
                .then(xml2js.parseStringAsync)
                .then(util.xmlErrorThrower, () => text_promise.then(util.textErrorThrower));
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
