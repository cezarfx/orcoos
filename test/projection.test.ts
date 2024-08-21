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

import {ISale, PurchaseMethod, Sale, populateDatabase} from './sale';
import { ONDB_URL } from './test-utils';


let allSales: Array<ISale> = [];

describe("Projection", () => {

    it('connect', async() => {
        expect(await connect(ONDB_URL, {logLevel: 2}));
    });
    
    it('delete all and populate sale', async() => {
        expect(await Sale.deleteMany());
        expect(await Sale.count()).equal(0);

        allSales = await populateDatabase();
        expect(await Sale.count()).equal(allSales.length);
    }).timeout(3000);

    it('project {}', async () => {
        // Q: SELECT * FROM o_sales t
        let res = await Sale.find({}, {});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.a('object');
            expect(sale.saleDate).to.be.a('date');
            expect(sale.items).to.be.an('array');
            expect(sale.items[0].name).to.be.a('string');
            expect(sale.items[0].price).to.be.a('number');
            expect(sale.items[0].quantity).to.be.a('number');
            expect(sale.items[0].tags).to.be.an('array');
            expect(sale.storeLocation).to.be.a('string');
            expect(sale.customer).to.be.an('object');
            expect(sale.customer.email).to.be.a('string');
            expect(sale.customer.age).to.be.a('number');
            expect(sale.customer.gender).to.be.a('string');
            expect(typeof sale.customer.satisfaction).to.be.oneOf(['undefined', 'number']);
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });

    it('exclude _id', async() => {
        // Q: SELECT 
        //      $t."saleDate"[] AS saleDate,   // no kvid!
        //      [{'name': $t."items"."name"[], 
        //      'price': $t."items"."price"[], 
        //      'quantity': $t."items"."quantity"[], 
        //      'tags': $t."items"."tags"[]}] AS items, 
        //      $t."storeLocation"[] AS storeLocation, 
        //      {'gender': $t."customer"."gender"[], 'age': $t."customer"."age"[], 'email': $t."customer"."email"[], 'satisfaction': $t."customer"."satisfaction"[]} AS customer, 
        //      $t."couponUsed"[] AS couponUsed, 
        //      $t."purchaseMethod"[] AS purchaseMethod 
        //    FROM sales $t
        let res = await Sale.find({}, {_id: 0});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined; 
            expect(sale.saleDate).to.be.a('date');
            expect(sale.items).to.be.an('array');
            expect(sale.storeLocation).to.be.a('string');
            expect(sale.customer).to.be.an('object');
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });

    it('project string "saleDate purchaseMethod" ', async() => {
        // Q: SELECT t.kvid AS kvid, t."saleDate"[] AS saleDate, t."purchaseMethod"[] AS purchaseMethod FROM o_sales t
        let res = await Sale.find({}, 'saleDate purchaseMethod');
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.a('object'); 
            expect(sale.saleDate).to.be.a('date');
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });

    it('project obj {saleDate: 1, purchaseMethod: 1}" ', async() => {
        // Q: SELECT t.kvid AS kvid, t."saleDate"[] AS saleDate, t."purchaseMethod"[] AS purchaseMethod FROM o_sales t
        let res = await Sale.find({}, {saleDate: 1, purchaseMethod: 1});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.a('object'); 
            expect(sale.saleDate).to.be.a('date');
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });

    it('project no_id, obj {_id: 0, saleDate: 1, purchaseMethod: 1}" ', async() => {
        // Q: SELECT t."saleDate"[] AS saleDate, t."purchaseMethod"[] AS purchaseMethod FROM o_sales t
        let res = await Sale.find({}, {_id: 0, saleDate: 1, purchaseMethod: 1});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined; 
            expect(sale.saleDate).to.be.a('date');
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });

    it('prjct incl deep' , async() => {
        // Q: SELECT t."couponUsed"[] AS couponUsed, {'age': t."customer"."age"[]} AS customer, [{'name': t."items"."name"[], 'price': t."items"."price"[]}] AS items FROM o_sales t
        let res = await Sale.find({}, {_id: 0, couponUsed: 1, 'customer.age': 1, 'items.name': 1, 'items.price': 1});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.an('array');
            expect(sale.items[0].name).to.be.an('string');
            expect(sale.items[0].price).to.be.an('number');
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.an('object');
            expect(sale.customer.age).to.be.an('number');
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.undefined;
        }
    });

    //todo: support new style include: {items: {price: 1}, saleDate: 1, customer: {age: 1}}

    it('prjct both incl and excl' , async() => {
        let res = Sale.find({}, {couponUsed: 1, 'customer.age': 0, 'items.price': 1});
        await expect(res).to.eventually.be.rejectedWith(Error, 'Projection cannot be both exclusive and inclusive: {"couponUsed":1,"customer.age":0,"items.price":1}');
    });

    it('project exclude fields, obj {saleDate: 0, purchaseMethod: 0}" ', async() => {
        // Q: SELECT t.kvid AS kvid, [{'name': t."items"."name"[], 'price': t."items"."price"[], 'quantity': t."items"."quantity"[], 'tags': t."items"."tags"[]}] AS items, t."storeLocation"[] AS storeLocation, {'gender': t."customer"."gender"[], 'age': t."customer"."age"[], 'email': t."customer"."email"[], 'satisfaction': t."customer"."satisfaction"[]} AS customer, t."couponUsed"[] AS couponUsed FROM o_sales t
        let res = await Sale.find({}, {saleDate: 0, purchaseMethod: 0});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.an('object');
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.an('array');
            expect(sale.storeLocation).to.be.a('string');
            expect(sale.customer).to.be.an('object');
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.undefined;
        }
    });

    it('project exclude fields, obj {_id: 0, saleDate: 0, purchaseMethod: 0}" ', async() => {
        // Q:  SELECT t."saleDate"[] AS saleDate, t."storeLocation"[] AS storeLocation, t."couponUsed"[] AS couponUsed, t."purchaseMethod"[] AS purchaseMethod FROM o_sales t
        let res = await Sale.find({}, {_id: 0, saleDate: 0, purchaseMethod: 0});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.an('array');
            expect(sale.storeLocation).to.be.a('string');
            expect(sale.customer).to.be.an('object');
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.undefined;
        }
    });

    it('project exclude complex fields, obj {_id: 0, items: 0, customer: 0}" ', async() => {
        // Q: SELECT t."saleDate"[] AS saleDate, t."storeLocation"[] AS storeLocation, t."couponUsed"[] AS couponUsed, t."purchaseMethod"[] AS purchaseMethod FROM o_sales t
        let res = await Sale.find({}, {_id: 0, items: 0, customer: 0});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.a('date');
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.a('string');
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });

    it('project exclude deep fields, obj {_id: 0, customer.age: 0, items.price: 0}" ', async() => {
        // Q: SELECT 
        //    {  
        //      'gender': t."customer"."gender"[],    // no age
        //      'email': t."customer"."email"[], 
        //      'satisfaction': t."customer"."satisfaction"[]
        //    } AS customer, 
        //    [{
        //       'name': t."items"."name"[],          // no price
        //       'quantity': t."items"."quantity"[], 
        //       'tags': t."items"."tags"[]
        //    }] AS items, 
        //    t."saleDate"[] AS saleDate, 
        //    t."storeLocation"[] AS storeLocation, 
        //    t."couponUsed"[] AS couponUsed, 
        //    t."purchaseMethod"[] AS purchaseMethod 
        //    FROM o_sales t
        let res = await Sale.find({}, {_id: 0, 'customer.age': 0, 'items.price': 0});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.a('date');
            expect(sale.items).to.be.an('array');
            expect(sale.items[0].price).to.be.undefined;
            expect(sale.items[0].name).to.be.a('string');
            expect(sale.storeLocation).to.be.a('string');
            expect(sale.customer).to.be.an('object');
            expect(sale.customer.age).to.be.undefined;
            expect(sale.customer.gender).to.be.a('string');
            expect(sale.customer.email).to.be.a('string');
            expect(sale.customer.satisfaction).to.be.undefined; // no data in db
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.a('string');
        }
    });
});

describe('Projection with extra fields', () => {
    it('project include fields: {_id: 0, v: "abc"}', async() => {
        // Q: SELECT {'v': 'abc'} as kvjson FROM o_sales t
        let res = await Sale.find({}, {_id: 0, v: 'abc'});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be,undefined;
            expect(sale._doc.v).to.be.a('string');
            expect(sale._doc.v).equal('abc');
        }
    });

    it('project include extra fields with db value: {_id: 0, v: "$customer.email"}', async() => {
        // Q: SELECT {'v': 'abc'} as kvjson FROM o_sales t
        let res = await Sale.find({}, {_id: 0, v: '$customer.email'});
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.undefined;
            expect(sale._doc.v).to.be.a('string');
            expect(sale._doc.v).to.contain('@e.mail');
        }
    });

    it("project with arithmetics, conditionals & logical", async() => {
        // Q: SELECT {'customer': t.kvjson."customer"[], 'couponUsed': t.kvjson."couponUsed"[], 
        //      'mult': (t.kvjson."customer"."age"[] * 2), 
        //      'div': (t.kvjson."customer"."age"[] div 2), 
        //      'add': (t.kvjson."customer"."age"[] + 2), 
        //      'sub': (t.kvjson."customer"."age"[] - 2),
        //      'eq': (t.kvjson."customer"."age"[] = 2), 
        //      'ne': (t.kvjson."customer"."age"[] != 2), 
        //      'gt': (t.kvjson."customer"."age"[] > 2),
        //      'gte': (t.kvjson."customer"."age"[] >= 2),
        //      'lt': (t.kvjson."customer"."age"[] < 2),
        //      'lte': (t.kvjson."customer"."age"[] <= 2),
        //      'and': (t.kvjson."couponUsed"[] AND true),
        //      'or': (t.kvjson."couponUsed"[] OR false),
        //      'not': ( NOT t.kvjson."couponUsed"[])} 
        //    as kvjson FROM o_sales t
        let res = await Sale.find({}, {_id:0, customer: 1, couponUsed: 1,
            mult: {$multiply: ['$customer.age', 2]},
            div: {$divide: ['$customer.age', 2]},
            mod: {$mod: ['$customer.age', 2]},
            add: {$add: ['$customer.age', 2]},
            sub: {$subtract: ['$customer.age', 2]},

            eq: {$eq: ['$customer.age', 2]},
            ne: {$ne: ['$customer.age', 2]},
            gt: {$gt: ['$customer.age', 2]},
            gte: {$gte: ['$customer.age', 2]},
            lt: {$lt: ['$customer.age', 2]},
            lte: {$lte: ['$customer.age', 2]},

            and: {$and: ['$couponUsed', true]},
            or: {$or: ['$couponUsed', false]},
            not: {$not: '$couponUsed'},

            concat: {$concat: ['$customer.email', 'ABC']}
        });
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.an('object');
            expect(sale.customer.age).to.be.a('number');
            expect(sale.customer.email).to.be.a('string');
            expect(sale.couponUsed).to.be.a('boolean');
            expect(sale.purchaseMethod).to.be.undefined;

            expect(sale._doc.mult).to.be.a('number');
            expect(sale._doc.mult).to.be.equal(sale.customer.age * 2);
            expect(sale._doc.div).to.be.a('number');
            expect(sale._doc.div).to.be.equal(sale.customer.age / 2);
            expect(sale._doc.mod).to.be.a('number');
            expect(sale._doc.mod).to.be.equal(sale.customer.age % 2);
            expect(sale._doc.add).to.be.a('number');
            expect(sale._doc.add).to.be.equal(sale.customer.age + 2);
            expect(sale._doc.sub).to.be.a('number');
            expect(sale._doc.sub).to.be.equal(sale.customer.age - 2);

            expect(sale._doc.eq).to.be.a('boolean');
            expect(sale._doc.eq).to.be.equal(sale.customer.age == 2);
            expect(sale._doc.ne).to.be.a('boolean');
            expect(sale._doc.ne).to.be.equal(sale.customer.age != 2);
            expect(sale._doc.gt).to.be.a('boolean');
            expect(sale._doc.gt).to.be.equal(sale.customer.age > 2);
            expect(sale._doc.gte).to.be.a('boolean');
            expect(sale._doc.gte).to.be.equal(sale.customer.age >= 2);
            expect(sale._doc.lt).to.be.a('boolean');
            expect(sale._doc.lt).to.be.equal(sale.customer.age < 2);
            expect(sale._doc.lte).to.be.a('boolean');
            expect(sale._doc.lte).to.be.equal(sale.customer.age <= 2);
            
            expect(sale._doc.and).to.be.a('boolean');
            expect(sale._doc.and).to.be.equal(sale.couponUsed && true);
            expect(sale._doc.or).to.be.a('boolean');
            expect(sale._doc.or).to.be.equal(sale.couponUsed || false);
            expect(sale._doc.not).to.be.a('boolean');
            expect(sale._doc.not).to.be.equal(!sale.couponUsed);

            expect(sale._doc.concat).to.be.a('string');
            expect(sale._doc.concat).to.be.equal(sale.customer.email + 'ABC');
        }
    });

    it("project with operation layers $multiply, $divide, etc ...", async() => {
        // Q: SELECT 
        //    {'customer': {'age': t.kvjson."customer"."age"[]}, 
        //     'l1': (t.kvjson."customer"."age"[] * 
        //               (t.kvjson."customer"."age"[] div 
        //                    (t.kvjson."customer"."age"[] + (t.kvjson."customer"."age"[] - 2))))}
        //    as kvjson FROM o_sales t
        let res = await Sale.find({}, {_id:0, "customer.age": 1,
            l1: {$multiply: ['$customer.age', 
                  {$divide: ['$customer.age', 
                    {$add: ['$customer.age', 
                       {$subtract: ['$customer.age', 2]}]}]}]}
        });
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.an('object');
            expect(sale.customer.age).to.be.a('number');
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.undefined;

            expect(sale._doc.l1).to.be.a('number');
            expect(sale._doc.l1).to.be.equal(sale.customer.age * (sale.customer.age / (sale.customer.age + (sale.customer.age - 2))));
        }
    });

    it("project with math func", async() => {
        // Q: SELECT 
        //    {'abs': abs(-123), 
        //     'ceil': ceil(1.234), 
        //     'floor': floor(12.34), 
        //     'round': round(1234.5678, 2), 
        //     'trunk': trunc(1234.5678, 2), 
        //     'exp': exp(1234), 
        //     'log': log(100, 10), 
        //     'log10': log10(1000), 
        //     'ln': ln(2.718281828459045),
        //     'pow': power(123, 2), 
        //     'sqrt': sqrt(1234), 
        //     'rand': rand(),
        //     'mod': (11-(11/2*2))}
        //    as kvjson FROM o_sales t
        let res = await Sale.find({}, {_id:0,
            abs: {$abs: -123}, 
            ceil: {$ceil: 1.234}, 
            floor: {$floor: 12.34}, 
            round: {$round : [1234.5678, 2]},
            trunk: {$trunc : [1234.5678, 2]},
            exp: {$exp: 3},
            log: {$log: [100, 10]},
            log10: {$log10: 1000},
            ln: {$ln: 2.718281828459045},
            pow: {$pow: [123, 2]},
            sqrt: {$sqrt: 1234},
            rand: {$rand: {}},
            mod: {$mod: [11, 2]}
        });
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.undefined
            
            expect(sale._doc.abs).to.be.a('number');
            expect(sale._doc.abs).to.be.equal(Math.abs(-123));
            expect(sale._doc.ceil).to.be.a('number');
            expect(sale._doc.ceil).to.be.equal(Math.ceil(1.234));
            expect(sale._doc.floor).to.be.a('number');
            expect(sale._doc.floor).to.be.equal(Math.floor(12.34));
            expect(sale._doc.round).to.be.a('number');
            expect(sale._doc.round).to.be.equal(1234.57);
            expect(sale._doc.trunk).to.be.a('number');
            expect(sale._doc.trunk).to.be.equal(1234.56);
            expect(sale._doc.exp).to.be.a('number');
            expect(sale._doc.exp).to.be.equal(Math.exp(3));
            expect(sale._doc.log).to.be.a('number');
            expect(sale._doc.log).to.be.equal(2);
            expect(sale._doc.log10).to.be.a('number');
            expect(sale._doc.log10).to.be.equal(3);
            expect(sale._doc.ln).to.be.a('number');
            expect(sale._doc.ln).to.be.equal(1);
            expect(sale._doc.pow).to.be.a('number');
            expect(sale._doc.pow).to.be.equal(Math.pow(123, 2));
            expect(sale._doc.sqrt).to.be.a('number');
            expect(sale._doc.sqrt).to.be.equal(Math.sqrt(1234));
            expect(sale._doc.rand).to.be.a('number');
            expect(sale._doc.rand).to.be.gte(0).and.lte(1);
            expect(sale._doc.mod).to.be.a('number');
            expect(sale._doc.mod).to.be.equal(1);
        }
    });

    it("project with trigonometry", async() => {
        // Q: SELECT 
        //    {'sin': sin(0.5), 
        //     'cos': cos(0.33), 
        //     'tan': tan(3.14), 
        //     'asin': asin(0.3), 
        //     'acos': acos(0.6), 
        //     'atan': atan(90), 
        //     'atan2': atan2(3, 4), 
        //     'rad': degrees(3.141592653589793), 
        //     'deg': radians(180)}
        //    as kvjson FROM o_sales t
        let res = await Sale.find({}, {_id:0,
            sin: {$sin: 0.5}, 
            cos: {$cos: 0.33}, 
            tan: {$tan: 3.14}, 
            asin: {$asin : 0.30},
            acos: {$acos : 0.60},
            atan: {$atan: 90},
            atan2: {$atan2: [3, 4]},
            rad: {$radiansToDegrees: 3.141592653589793},
            deg: {$degreesToRadians: 180}
        });
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.undefined;

            expect(sale._doc.sin).to.be.a('number');
            expect(sale._doc.sin).to.be.equal(Math.sin(0.5));
            expect(sale._doc.cos).to.be.a('number');
            expect(sale._doc.cos).to.be.equal(Math.cos(0.33));
            expect(sale._doc.tan).to.be.a('number');
            expect(sale._doc.tan).to.be.equal(Math.tan(3.14));
            expect(sale._doc.asin).to.be.a('number');
            expect(sale._doc.asin).to.be.equal(Math.asin(0.30));
            expect(sale._doc.acos).to.be.a('number');
            expect(sale._doc.acos).to.be.equal(Math.acos(0.60));
            expect(sale._doc.atan).to.be.a('number');
            expect(sale._doc.atan).to.be.equal(Math.atan(90));
            expect(sale._doc.atan2).to.be.a('number');
            expect(sale._doc.atan2).to.be.equal(Math.atan2(3, 4));
            expect(sale._doc.rad).to.be.a('number');
            expect(sale._doc.rad).to.be.equal(180);
            expect(sale._doc.deg).to.be.a('number');
            expect(sale._doc.deg).to.be.equal(3.141592653589793);
        }
    });

    it("project with string functions", async() => {
        // Q: SELECT 
        //      concat('a', 'b', 'c') AS conc, 
        //      substring('abcabcabc', 3, 3) AS substr, 
        //      upper('abcABC') AS toUpper, 
        //      lower('abcABC') AS toLower, 
        //      trim('  abcABC  ', "both") AS trim1, 
        //      trim('aabcABCC', "both", 'a') AS trim2, 
        //      trim(' abc ', "leading") AS ltrim1, 
        //      trim('aabc ', "leading", 'a') AS ltrim2, 
        //      trim(' abc  ', "trailing") AS rtrim1, 
        //      trim('abcABCCC', "trailing", 'C') AS rtrim2, 
        //      length('abcABC') AS srtLen, 
        //      index_of('abcABC', 'c') AS idxOf1, 
        //      index_of('cabcABC', 'c',2) AS idxOf2 
        //    FROM o_sales t
        let res = await Sale.find({}, {_id:0,
            conc: {$concat: ['a', 'b', 'c']}, 
            substr: {$substrCP: ['abcabcabc', 3, 3]}, 
            toUpper: {$toUpper: 'abcABC'}, 
            toLower: {$toLower : 'abcABC'},
            trim1: {$trim: {input: '  abcABC  '}},
            trim2: {$trim: {input: 'aabcABCC', chars: 'a'}},
            ltrim1: {$ltrim: {input: ' abc '}},
            ltrim2: {$ltrim: {input: 'aabc ', chars: 'a'}},
            rtrim1: {$rtrim: {input: ' abc  '}},
            rtrim2: {$rtrim: {input: 'abcABCCC', chars: 'C'}},
            srtLen: {$strLenCP: 'abcABC'},
            idxOf1: {$indexOfCP: ['abcABC', 'c']},
            idxOf2: {$indexOfCP: ['cabcABC', 'c', 2]},
        });
        expect(res).to.be.an('array');
        expect(res.length).equal(allSales.length);
        for (let sale of res) {
            expect(sale._id).to.be.undefined;
            expect(sale.saleDate).to.be.undefined;
            expect(sale.items).to.be.undefined;
            expect(sale.storeLocation).to.be.undefined;
            expect(sale.customer).to.be.undefined;
            expect(sale.couponUsed).to.be.undefined;
            expect(sale.purchaseMethod).to.be.undefined
            
            expect(sale._doc.conc).to.be.a('string');
            expect(sale._doc.conc).to.be.equal('abc');
            expect(sale._doc.substr).to.be.a('string');
            expect(sale._doc.substr).to.be.equal('abc');
            expect(sale._doc.toUpper).to.be.a('string');
            expect(sale._doc.toUpper).to.be.equal('ABCABC');
            expect(sale._doc.toLower).to.be.a('string');
            expect(sale._doc.toLower).to.be.equal('abcabc');
            expect(sale._doc.trim1).to.be.a('string');
            expect(sale._doc.trim1).to.be.equal('abcABC');
            expect(sale._doc.trim2).to.be.a('string');
            expect(sale._doc.trim2).to.be.equal('bcABCC');
            expect(sale._doc.ltrim1).to.be.a('string');
            expect(sale._doc.ltrim1).to.be.equal('abc ');
            expect(sale._doc.ltrim2).to.be.a('string');
            expect(sale._doc.ltrim2).to.be.equal('bc ');
            expect(sale._doc.rtrim1).to.be.a('string');
            expect(sale._doc.rtrim1).to.be.equal(' abc');
            expect(sale._doc.rtrim2).to.be.a('string');
            expect(sale._doc.rtrim2).to.be.equal('abcAB');
            expect(sale._doc.srtLen).to.be.a('number');
            expect(sale._doc.srtLen).to.be.equal(6);
            expect(sale._doc.idxOf1).to.be.a('number');
            expect(sale._doc.idxOf1).to.be.equal(2);
            expect(sale._doc.idxOf2).to.be.a('number');
            expect(sale._doc.idxOf2).to.be.equal(3);
        }
    });

});