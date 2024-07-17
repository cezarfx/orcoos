import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import { NoSQLClient, TableState } from 'oracle-nosqldb';

import {Sale} from './sale';

let tableNames: Array<string> = [
    'players', 'sales', 'items', 'customers', 'dateplayers'
];

async function dropTable(client: NoSQLClient, tableName: string) {
    try {
        let ddl = 'DROP TABLE IF EXISTS ' + tableName;
        let res = await client.tableDDL(ddl);
        // Wait for the operation completion
        await client.forCompletion(res);
        //console.log('  Table %s is dropped. State: %s', res.tableName, res.tableState);
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
        let r = await connect('nosqldb+on_prem+http://localhost:8080', {debug: 5});
        expect(r).not.empty;
        // get NoSQL DB driver client object
        client = r.connection.client.client;
    });
    
    it('drop test tables', async() => {
        tableNames.forEach(async t => await dropTable(client, t));

        await new Promise(resolve => setTimeout(resolve, 5000));
    }).timeout(30000);
});