import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import {ISale, Sale, populateDatabase} from './sale';

describe("Math operations", () => {
    let allSales: Array<ISale> = [];

    it('connect', async() => {
        expect(await connect('nosqldb+on_prem+http://localhost:8080', {debug: 1}));
    });
    
    it('delete all and populate sale', async() => {
        expect(await Sale.deleteMany());
        expect(await Sale.count()).equal(0);

        allSales = await populateDatabase();
    }).timeout(3000);

    // todo: Decide if we have to support $expr
    it('add error', async () => {
        // All work, note await is important!
        await expect(Sale.find({$expr: { $eq: ['items.price', {$add: ['items.quantity', 3.44]}] } }))
            .to.be.rejectedWith(Error, 'Unknown top level operator: $expr');
    });

    
    // SELECT * FROM o_sales t WHERE ((t.kvjson."items"[]."price" > t.kvjson."items"[]."quamtity" + 60))
    // SELECT * FROM o_sales t WHERE ((t.kvjson."customer"."age" > t.kvjson."customer"."satisfaction" + 10))
    
    // SELECT * FROM o_sales t WHERE ((t.kvjson."customer"."age" > 18 and t.kvjson."customer"."satisfaction" > 9))
    // find( {$and: [{"customer.age}: {$gt: 18}}, {"customer.satisfaction": {$gt: 9}}]} )

    // SELECT * FROM o_sales t WHERE ((t.kvjson."customer"."age" * t.kvjson."customer"."satisfaction" > 100))
    // db.sales.find({$expr: {$gt: [{$multiply: ['$customer.age', '$customer.satisfaction']}, 100]}})

    
    it('multiply 2 db props', async() => {
        expect(Sale.find({$expr: { $gt: [{$multiply: ['$customer.age', '$customer.satisfaction']}, 100] }}))
            .to.be.rejectedWith(Error, 'Unknown top level operator: $expr');
        // write a test for Sale model

    });

    

});