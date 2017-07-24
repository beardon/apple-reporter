# apple-reporter

[![Build Status](https://travis-ci.org/beardon/apple-reporter.svg?branch=master)](https://travis-ci.org/beardon/apple-reporter)
![Dependencies](https://david-dm.org/beardon/apple-reporter.svg)
[![codecov.io](http://codecov.io/github/beardon/apple-reporter/coverage.svg?branch=master)](http://codecov.io/github/beardon/apple-reporter?branch=master)

Promise-based [Apple iTunes Connect Reporter](http://help.apple.com/itc/appsreporterguide) for Node.js > 4.2.0.

Results are automagically ungzipped. In `Robot.XML` mode (which is default), the XML is parsed into an object using [xml2js](https://www.npmjs.com/package/xml2js). Errors result in a Promise rejection with best effort to set the `code` and `message` properties. Setting the `code` is not possible for text mode. (`code` defaults to -1)

## Installation

```bash
npm i -S apple-reporter
```

```bash
yarn add apple-reporter
```

## Example

### Initialization

```js
const AppleReporter = require('apple-reporter');

const reporter = new AppleReporter({
    userid: 'gy',
    accesstoken: 'your-itunesconnect-access-token'
});
```

### Usage

```js
function getFinanceReport() {
    return reporter.Finance.getStatus().then((status) => {
        return reporter.Finance.getReport({
            vendorNumber: 123456,
            regionCode: 'US',
            reportType: 'Financial',
            fiscalYear: '2015',
            fiscalPeriod: '02'
        })
        .then((report) => {
            // do stuff with report...
        })
        .catch((err) => {
            // uh-oh!
            console.error('Unable to get Finance report!');

            throw err;
        });
    }, (err) => {
        console.error('Finance is down!');

        throw err;
    });
}
```

## API

Refer to [Apple's documentation](http://help.apple.com/itc/appsreporterguide) for the specifications of each call. All `Sales`-based functions are under `reporter.Sales`, all `Finance`-based functions are under `reporter.Finance`

### Constructor
- `options` (object)
  - `baseUrl`: Base endpoint for the API (defaults to `https://reportingitc-reporter.apple.com/reportservice`)
  - `financeUrl`: Finance endpoint URL (defaults to `/finance/v1`)
  - `mode`: Either `Normal` or `Robot.XML` (defaults to `Robot.XML`)
  - `accesstoken`: iTunes Connect access token
  - `salesUrl`: Sales endpoint URL (defaults to `/sales/v1`)
  - `userid`: iTunes Connect account user ID
  - `version`: The API version (defaults to `1.0`)

### General
- [getVersion](https://help.apple.com/itc/appsreporterguide/#/itc7e183be3b)

### Sales
- [getAccounts](https://help.apple.com/itc/appsreporterguide/#/itcccef1d795)
- [getReport](https://help.apple.com/itc/appsreporterguide/#/itcbd9ed14ac)
- [getStatus](https://help.apple.com/itc/appsreporterguide/#/itc469b4b7eb)
- [getVendors](https://help.apple.com/itc/appsreporterguide/#/itcb14145fbd)
- [getVersion](https://help.apple.com/itc/appsreporterguide/#/itc7e183be3b)

### Finance
- [getAccounts](https://help.apple.com/itc/appsreporterguide/#/itcccef1d795)
- [getReport](https://help.apple.com/itc/appsreporterguide/#/itc21263284f)
- [getStatus](https://help.apple.com/itc/appsreporterguide/#/itc469b4b7eb)
- [getVendorsAndRegions](https://help.apple.com/itc/appsreporterguide/#/itc0bc116f31)
- [getVersion](https://help.apple.com/itc/appsreporterguide/#/itc7e183be3b)
