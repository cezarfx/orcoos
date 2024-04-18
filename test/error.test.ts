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

import {Sale, Item, PurchaseMethod, Gender, ISale} from './sale';
import { CastError } from '../lib';

describe("Errors for weired queries", () => {
    let sale: typeof Sale;
    let allExpectedSales:Array<typeof Sale> = [];

    let noOfRows = 0;
    let names = ["Al", "Bo", "Yo", "Jo", "Ax"];
    let cities = ["LA", "NY", "SF", "London", "Paris"];
    let itemNames = ["wine", "milk", "beer", "soda", "tea"];

    it('setup', async() => {
        expect(await connect('nosqldb+on_prem+http://localhost:8080', {debug: 4}));

        expect(await Sale.deleteMany());
        expect(await Sale.count()).equal(0);

        sale = new Sale({
            saleDate: new Date(),
            items: [new Item({
                name: "beer",
                price: 8.22,
                quantity: 4
            })],
            storeLocation: "NY"
        });
        expect(await sale.save());
        expect(await Sale.count()).equal(1);

        // console.log("_id: " + sale._id + " t: " + typeof sale._id);
        expect(sale._id).exist;
        expect(sale._id).to.be.a('object');
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.saleDate.getTime()).equal(sale.saleDate.getTime());
        expect(dbSale.storeLocation).equal(sale.storeLocation);
        expect(dbSale.purchaseMethod).equal(PurchaseMethod.InStore);
        expect(dbSale.items.length).equal(sale.items.length);
        expect(dbSale.items[0].name).equal(sale.items[0].name);
        expect(dbSale.items[0].price).equal(sale.items[0].price);
        expect(dbSale.items[0].quantity).equal(sale.items[0].quantity);
        expect(dbSale.customer).to.not.exist;
        allExpectedSales.push(sale);

        // // Add more sales
        // let saleCount = await Sale.count();
        // let r: number;
        
        // let allSales: Array<ISale> = [];

        // for( let name of names) {
        //     r = Math.round(1000 * Math.random());
  
        //     let city = cities[r % cities.length];
        //     const sale: ISale = new Sale<ISale>({
        //         saleDate: new Date(),
        //         items: [new Item({
        //             name: itemNames[r % itemNames.length],
        //             price: r/10,
        //             quantity: r % 10 + (city.length > 2 ? 10 : 0)
        //         })],
        //         storeLocation: city,
        //         customer: {
        //             gender: Object.values(Gender)[r % 2],
        //             age: r % 100,
        //             email: name + '@e.mail'
        //         }
        //     });
        //     allSales.push(sale);
        // };
    
        // let res = await Sale.insertMany(allSales, {rawResult: true});
        // expect(res).exist;
        // expect(res.acknoledged).equal(true);
        // expect(res.insertedIds).exist;
        // expect(res.insertedIds).to.be.a('array');
        // expect(res.insertedCount).equals(names.length);

        // expect(await Sale.count()).equal(saleCount + names.length);
        // noOfRows = saleCount + names.length;
        // allExpectedSales = allSales;
    });

    it('.find(null) not resolved', async() => {
        // await Sale.find(null);          // Error timeout
        let fnp = Sale.find(null);
        await sleep(1000);
        expect(fnp).to.not.be.fulfilled;
        expect(fnp).to.not.be.rejected;
    }).timeout(2000);


    it('errors', async() => {
        await expect(Sale.find({$or: {a: 1}})).to.be.rejectedWith('Cast to Array failed for value "{ a: 1 }" (type Object) at path "$or" for model "Sale"');
    
        await expect(Sale.find([])).to.be.rejectedWith('Parameter "filter" to find() must be an object, got');

        await expect(Sale.find({'items.quantity': {$or: [ {$lt: 10}, {$gt: 10} ]}})).to.be.rejectedWith(CastError);
        await expect(Sale.find({'items.quantity': {$or: [ {$lt: 10}, {$gt: 10} ]}})).to.be.rejectedWith('Cast to number failed for value "[ { \'$lt\': 10 }, { \'$gt\': 10 } ]" (type Array) at path "quantity" for model "Sale"');

        
    });

});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}
