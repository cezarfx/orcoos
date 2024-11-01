import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import { TableState } from 'oracle-nosqldb';

let client;
import {Sale} from './sale';
import { ONDB_URL, TEST_TABLE_OPTIONS } from './test-utils';

let tableName = 'o_sales';

async function dropSale() {
    try {
        let ddl = 'DROP TABLE IF EXISTS ' + tableName;
        let res = await client.tableDDL(ddl);
        // Wait for the operation completion
        await client.forCompletion(res);
        
        expect(res.tableState).equal(TableState.DROPPED);
    } catch(err) {
        console.log('Error while dropping: ' + err);
        expect(err).to.be.empty;
    }
}

async function createSale() {
    try {
        let ddl = 'CREATE TABLE IF NOT EXISTS ' + tableName + '(kvid STRING, PRIMARY KEY(kvid)) AS JSON COLLECTION';
        let res = await client.tableDDL(ddl, {...TEST_TABLE_OPTIONS.collectionOptions});
        // Wait for the operation completion
        await client.forCompletion(res);
        
        expect(res.tableState).equal(TableState.ACTIVE);
    } catch(err) {
        console.log('Error while dropping: ' + err);
        expect(err).to.be.empty;
    }
}


describe("Create and Drop tables", () => {
    it('connect', async() => {
        let r = await connect(ONDB_URL);
        expect(r).not.empty;
        // get NoSQL DB driver clielt object
        client = r.connection.client.client;
    });
    
    it('drop and create', async() => {
        await dropSale();
        await createSale();
    }).timeout(30000);

    it('drop and get all', async() => {
        await dropSale();
        let q = 'select * from ' + tableName;
        let res = await Sale.nosqlQuery(q);
        expect(res).to.be.empty;
    }).timeout(30000);

    it('drop table', async() => {
        await dropSale();
    }).timeout(30000);

    it('drop and count', async() => {
        await dropSale();
        let c = await Sale.countDocuments();
        expect(c).equal(0);
    }).timeout(30000);

    it('drop table', async() => {
        await dropSale();
    }).timeout(30000);

    it('drop and find', async() => {
        await dropSale();
        Sale.db.db.prepStmtCache.clear();
        try {
            let dbSales = await Sale.find();
            expect(dbSales).to.be.empty;
        } catch(e) {
            console.log('!!! Exception: ' + e);
            // Ignore expected error since the prepared statment cache will contain reference to old table.
        }
        let dbSales = await Sale.find();
        expect(dbSales).to.be.empty;
    }).timeout(30000);

    it('drop table', async() => {
        await dropSale();
    }).timeout(30000);

    it('drop and deleteMany', async() => {
        await dropSale();
        let dbSales = await Sale.deleteMany();
        expect(dbSales).equal(0);
    }).timeout(30000);
});