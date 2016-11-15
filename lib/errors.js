'use strict';

const ExtendableError = require('es6-error');

class AppleReporterError extends ExtendableError {
    constructor(message, code = -1) {
        super(message);

        this.code = String(code);
    }
}

module.exports = {
    AppleReporterError
};
