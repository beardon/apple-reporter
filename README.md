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

You can initialize an `AppleReporter` with an access token or the account password.

```js
const AppleReporter = require('apple-reporter');

const reporter = new AppleReporter({
    userid: 'your-itunesocnnect-userid',
    accesstoken: 'your-itunesconnect-access-token',
});

// OR:
const reporter = new AppleReporter({
    userid: 'your-itunesocnnect-userid',
    password: 'your-itunesconnect-account-password',
});
```
If you supply a **password**, note that an access token **is still required** to fetch data.
However, supplying a password allows you to call `reporter.retrieveAccessToken()` to automatically retrieve and set the access token for the account:

```js
const AppleReporter = require('apple-reporter');

const reporter = new AppleReporter({
    userid: 'your-itunesocnnect-userid',
    password: 'your-itunesconnect-account-password',
});

reporter.retrieveAccessToken()
.then(({ token }) => {
    console.log(`The account access token is ${token}`);
    
    // Other methods will now work (see 'Usage' section)
})
```

`retrieveAccessToken()` will normally throw an error if your account does not have an access token, or the access token is expired.
However, if called with the optional `generateNewIfNeeded: true`, a new access code will simply be generated in these scenarios:

```js
reporter.retrieveAccessToken({ generateNewIfNeeded: true })
.then(({ token, isNew }) => {
    console.log(`Token: ${token}, was newly generated: ${isNew}`);
    
    // Other API methods will now work (see 'Usage' section)
})
```

If you supply an access token to begin with, you do not need to call this method before using the rest of the library.

### Usage

Example:

```js
reporter.Finance.getStatus().then((status) => {
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
}, err => {
    console.error('Finance is down!');

    throw err;
});  
```

## API

Refer to [Apple's documentation](http://help.apple.com/itc/appsreporterguide) for the specifications of each call. All `Sales`-based functions are under `reporter.Sales`, all `Finance`-based functions are under `reporter.Finance`

### Constructor
- `options` (object)
  - `baseUrl`: Base endpoint for the API (defaults to `https://reportingitc-reporter.apple.com/reportservice`)
  - `financeUrl`: Finance endpoint URL (defaults to `/finance/v1`)
  - `mode`: Either `Normal` or `Robot.XML` (defaults to `Robot.XML`)
  - `accesstoken`: iTunes Connect access token
  - `password`: iTunes Connect account password
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
