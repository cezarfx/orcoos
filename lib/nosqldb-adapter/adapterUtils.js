/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 */

const utils = require('../utils');

/**
 * Used for debugging.
 */
const LOG_LEVELS = Object.freeze({
    NONE: 0,
    SEVERE: 1,
    WARNING: 2,
    INFO: 3,
    CONFIG: 4,
    FINE: 5,
    FINNER: 6
});

/**
 * Logs the @param msg to console depending on the @param level .
 */
function log(options, level, msg) {
    if (options && options['logLevel'] >= level) {
        console.log(msg);

        if (level < LOG_LEVELS.NONE)
            level = LOG_LEVELS.NONE;
        if (level > LOG_LEVELS.FINNER)
            level = LOG_LEVELS.FINNER;
    
        utils.warnWithType(Object.keys(LOG_LEVELS)[level], msg);
    }
}

/**
 * Simple mutex implementation based on promises.
 */
class OrcoosMutex {
    _r /*: Array<any>*/;
    _count /*: number*/;
    constructor() {
        this._r = [];
        this._count = 0;
    }

    async acquire() /*: Promise<any>*/ {
        let prom = new Promise(async (res, rej) => 
            { 
                if (this._count <= 0) {
                    res(undefined);
                } else {
                    this._r.push(res);
                }
            });
        this._count += 1;
        await prom;
    }

    isLocked() /*: boolean*/ {
        return this._count > 0;
    }

    release() /*: void*/ {
        if (this._count > 0) {
            let res = this._r.shift();
            if (res) {
                res(undefined);
            }
            this._count -= 1;
        } else {
            while( this._r.length > 0) {
                let res = this._r.shift();
                if (res) {
                    res(undefined);
                }
            }
        }
    }
}

module.exports.LOG_LEVELS = LOG_LEVELS;
module.exports.log = log;
module.exports.OrcoosMutex = OrcoosMutex;