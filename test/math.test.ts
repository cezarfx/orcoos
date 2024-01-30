import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import {ISale, Sale, Item, Customer, PurchaseMethod, Gender} from './sale';

describe("Math operations", () => {
    it('connect', async() => {
        expect(await connect('http://localhost:8080', {debug: 1}));
    });
    
    it('delete all', async() => {
        expect(await Sale.deleteMany());
        expect(await Sale.count()).equal(0);
    }).timeout(3000);
    
    let sale: typeof Sale;
    let allExpectedSales:Array<typeof Sale> = [];

    it('save', async() => {
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
    
    let noOfRows = 0;
    let names = ["Al", "Bo", "Yo", "Jo", "Ax"];
    let cities = ["LA", "NY", "SF", "London", "Paris"];
    let itemNames = ["wine", "milk", "beer", "soda", "tea"];

    it('insertMany', async () => {
        let saleCount = await Sale.count();
        let r: number;
        
        let allSales: Array<ISale> = [];

        for( let name of names) {
            r = Math.round(1000 * Math.random());
  
            let city = cities[r % cities.length];
            const sale: ISale = new Sale<ISale>({
                saleDate: new Date(),
                items: [new Item({
                    name: itemNames[r % itemNames.length],
                    price: r/10,
                    quantity: r % 10 + (city.length > 2 ? 10 : 0)
                })],
                storeLocation: city,
                customer: {
                    gender: Object.values(Gender)[r % 2],
                    age: r % 100,
                    email: name + '@e.mail'
                }
            });
            allSales.push(sale);
        };
    
        let res = await Sale.insertMany(allSales, {rawResult: true});
        expect(res).exist;
        expect(res.acknoledged).equal(true);
        expect(res.insertedIds).exist;
        expect(res.insertedIds).to.be.a('array');
        expect(res.insertedCount).equals(names.length);

        expect(await Sale.count()).equal(saleCount + names.length);
        noOfRows = saleCount + names.length;
        allExpectedSales = allSales;
    });
  
    it('simple query', async () => {
        let allSales = await Sale.find();
        expect(allSales).to.be.an('array');
        expect(allSales.length).equal(noOfRows);
        for (let sale of allSales) {
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.oneOf(cities);
        }
        expect(allSales.length).equal(allExpectedSales.length + 1);
    });

    // todo: Decide if we have to support $expr
    it('add', async () => {
        expect(Sale.find({$expr: { $eq: ['items.price', {$add: ['items.quantity', 3.44]}] } }))
            .to.be.rejectedWith('Unknown top lebel operator: $expr');
    });
});