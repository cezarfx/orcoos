/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 */

import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { OrcoosMutex } from "../lib/nosqldb-adapter/adapterUtils";


const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lock = new OrcoosMutex();
let value = -1;

async function f(n: number) {
    await lock.acquire();
    try {
        if (value >= 0) {
            throw new Error("Lock not working corectly!");
        }
        value = n;
        // console.log("Start " + n + " ...");
        await wait(100);
        if (value != n) {
            throw new Error("Lock not working corectly!!");
        }
    } finally {
        value = -1;
        lock.release();
        // console.log("End . " + n);
    }
}


describe("Check Mutex", () => {
    it('aquire & relese', async() => {
        let pa: Array<Promise<any>> = [];
        for(let i = 0; i < 4; i ++) {
            pa.push(f(i));
        }
        await Promise.all(pa);
        // console.log('Done 1');
    
        lock.release();
        lock.release();
    
    
        for(let i = 10; i < 14; i ++) {
            pa.push(f(i));
        }
        
        await Promise.all(pa);
        // console.log('Done 2');
    
        // setTimeout(v => console.log("Done done"), 100);    
    }).timeout(10000);
    
    it('isLocked', async() => {
        expect(lock.isLocked()).false;
        await lock.acquire();
        expect(lock.isLocked()).true;
        lock.release();
        expect(lock.isLocked()).false;
    });

    it('isLocked 2', async() => {
        expect(lock.isLocked()).false;
        await lock.acquire();
        expect(lock.isLocked()).true;
        lock.release();
        expect(lock.isLocked()).false;

        await lock.acquire();
        expect(lock.isLocked()).true;
        lock.release();
        expect(lock.isLocked()).false;
    });
});
