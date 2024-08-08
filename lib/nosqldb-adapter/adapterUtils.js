/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 */

/*export*/ 
class OrcoosMutex {
    _r /*: Array<any>*/;
    _count/*: number*/;
    constructor() {
        this._r = [];
        this._count = 0;
    }

    async acquire()/*: Promise<any>*/ {
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

    isLocked()/*: boolean*/ {
        return this._count > 0;
    }

    release()/*: void*/ {
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

module.exports.OrcoosMutex = OrcoosMutex;