import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import {Sale, Item, PurchaseMethod, Gender, ISale} from './sale';
import { CastError } from '../lib';

describe("Errors for weired queries", () => {
    let sale: typeof Sale;
    let allExpectedSales:Array<typeof Sale> = [];

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
