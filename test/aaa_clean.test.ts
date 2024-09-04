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

import { connect } from '../index';

import { NoSQLClient, TableState } from 'oracle-nosqldb';

import { ONDB_URL } from './test-utils';

let tableNames: Array<string> = [
    'ondbMongooseSDK:o_players', 'o_sales', 'o_cust', 'o_datePlayers'
];

async function dropTable(client: NoSQLClient, tableName: string) {
    try {
        let ddl = 'DROP TABLE IF EXISTS ' + tableName;
        let res = await client.tableDDL(ddl);
        // Wait for the operation completion
        await client.forCompletion(res);
        
        expect(res.tableState).equal(TableState.DROPPED);
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch(err) {
        console.log('Error while dropping: ' + err);
        expect(err).to.be.empty;
    }
}

describe("Connect and Drop all known test tables", () => {
    let client: NoSQLClient;
    it('connect', async() => {
        let r = await connect(ONDB_URL, { logLevel: 2 });
        expect(r).not.empty;
        // get NoSQL DB driver client object
        client = r.connection.client.client;
    });
    
    it('drop test tables', async() => {
        tableNames.forEach(async t => await dropTable(client, t));

        await new Promise(resolve => setTimeout(resolve, 5000));
    }).timeout(30000);
});