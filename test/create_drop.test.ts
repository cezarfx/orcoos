import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import { TableState } from 'oracle-nosqldb';

let client;
//  = new NoSQLClient({
//     serviceType: ServiceType.KVSTORE,
//     endpoint: "http://localhost:8080"
// });

import {Sale} from './sale';

let tableName = 'sales';

async function dropSale() {
    try {
        let ddl = 'DROP TABLE IF EXISTS ' + tableName;
        let res = await client.tableDDL(ddl);
        // Wait for the operation completion
        await client.forCompletion(res);
        console.log('  Table %s is dropped. State: %s', res.tableName, res.tableState);
        expect(res.tableState).equal(TableState.DROPPED);
    } catch(err) {
        console.log('Error while dropping: ' + err);
    }
}

async function createSale() {
    try {
        let ddl = 'CREATE TABLE IF NOT EXISTS ' + tableName + '(kvid STRING, kvjson JSON, PRIMARY KEY(kvid))';
        let res = await client.tableDDL(ddl);
        // Wait for the operation completion
        await client.forCompletion(res);
        console.log('  Table %s is dropped. State: %s', res.tableName, res.tableState);
        expect(res.tableState).equal(TableState.ACTIVE);
    } catch(err) {
        console.log('Error while dropping: ' + err);
    }
}


describe("Create and Drop tables", () => {
    it('connect', async() => {
        let r = await connect('http://localhost:8080');
        expect(r).not.empty;
        // get NoSQL DB driver clielt object
        client = r.connection.client.client;
    });
    
    it('drop cr', async() => {
        await dropSale();
        await createSale();
        // await dropSale();
    }).timeout(30000);

    it('drop and get all', async() => {
        await dropSale;
        let q = 'select * from sales';
        let res = await Sale.nosqlQuery(q);
        //console.log(res);
        expect(res).to.be.empty;
    }).timeout(30000);

    it('drop table', async() => {
        await dropSale();
    }).timeout(30000);

    it('drop and count', async() => {
        await dropSale();
        let c = await Sale.count();
        expect(c).equal(0);
    }).timeout(30000);

    it('drop table', async() => {
        await dropSale();
    }).timeout(30000);

    it('drop and find', async() => {
        await dropSale();
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
    
    // it('direct nosql client', async () => {
    //     let client = new NoSQLClient({
    //         serviceType: ServiceType.KVSTORE,
    //         endpoint: "http://localhost:8080"
    //     });

    //     let ddl = 'CREATE TABLE IF NOT EXISTS direct_sales(kvid STRING, kvjson JSON, PRIMARY KEY(kvid))';
    //     let res = await client.tableDDL(ddl);
    //     console.log('  Creating table %s', res.tableName);
    //     console.log('  Table state: %s', res.tableState);
    
    //     // Wait for the operation completion
    //     await client.forCompletion(res);
    //     console.log('  Table %s is created', res.tableName);
    //     console.log('  Table state: %s', res.tableState);

    //     let TABLE_NAME = 'direct_sales';
    //     // Write a record
    //     console.log('\nWrite a record');
    //     let res2 = await client.put(TABLE_NAME, {
    //         kvid: '456',
    //         kvjson: {
    //             ipaddr: '10.0.00.yyy',
    //             audience_segment: {
    //                 sports_lover: '2019-01-05',
    //                 foodie: '2018-12-31'
    //             }
    //         }
    //     });
    //     if (res2.consumedCapacity) {
    //         console.log('  Write used: %O', res2.consumedCapacity);
    //     }

    //     // Read a record
    //     console.log('\nRead a record');
    //     let res3 = await client.get(TABLE_NAME, { kvid: '456' });
    //     console.log('  Got record: %O', res3.row);
    //     if (res3.consumedCapacity) {
    //         console.log('  Read used: %O', res3.consumedCapacity);
    //     }

    //     // Drop the table
    //     console.log('\nDrop table');
    //     const dropDDL = `DROP TABLE ${TABLE_NAME}`;
    //     let res4 = await client.tableDDL(dropDDL);
    //     console.log('  Dropping table %s', res4.tableName);

    //     // Wait for the table to be removed
    //     await client.forCompletion(res);
    //     console.log('  Operation completed');
    //     console.log('  Table state is %s', res4.tableState);
    // });

    // it('await test', async () => {
    //     // let r1 = await f(1);
    //     // let r2 = await f(2);
    //     // let r3 = await f(3);

    //     let r = await Promise.all([f(1), f(2), f(3)]);

    //     console.log("await results: " + r[0] + " " + r[1] + " " + r[2]);
    // }).timeout(4000);

    // it('prom test ', async () => {
    //     // let r1 = await f(1);
    //     // let r2 = await f(2);
    //     // let r3 = await f(3);

    //     let r = await Promise.all([fp(1), fp(2), fp(3)]);

    //     console.log("prom results: " + r[0] + " " + r[1] + " " + r[2]);
    // }).timeout(8000);
});

// let i = 1;

// async function f(param: number) {
//     console.log("f(" + param + ") was called i: " + i);
//     // return new Promise(res => {
//     //     setTimeout( () => { 
//     //         let ri = i++;
//     //         console.log("f(" + param + ") runs now -> " + (ri));
//     //         res(ri);
//     //     }, 4000 - 1000 * param);
//     // });
//     let r1 = await slowf(param);
//     let r2 = await slowf(param);
//     let r3 = await slowf(param);
//     return r1 + r2 + r3;
// }

// function fp(param: number) {
//     console.log("fp(" + param + ") was called i: " + i);
//     return new Promise((res, rej) => {
//         setTimeout( () => { 
//             let ri = i++;
//             console.log("fp(" + param + ") runs now -> " + (ri));
//             res(ri);
//         }, 8000 - 1000 * param);
//     });
// }

// async function slowf(param:number):Promise<number> {
//     return new Promise(res => {
//         setTimeout( () => { 
//             res(param);
//         }, 100);
//     });
// }