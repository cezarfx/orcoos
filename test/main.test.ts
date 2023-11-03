import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Schema, model, connect } from '../index';


// 1. Create an interface representing a document in MongoDB.
interface ISale {
    saleDate: Date;
    items?: [IItem];
    storeLocation: string;
    customer?: ICustomer;
    couponUsed?: boolean;
    purchaseMethod?: PurchaseMethod;
};

interface IItem {
    name: string;
    price: number;
    quantity: number;
};

interface ICustomer {
    gender?: Gender;
    age?: number;
    email?: string;
    satisfaction?: number;
};

enum Gender {
    M = 'M', 
    F = 'F'
};

enum PurchaseMethod {
    InStore = "InStore", 
    Online = "Online"
};


const itemSchema = new Schema<IItem>({
    name: String,
    price: Number,
    quantity: Number 
});

const customerSchema = new Schema<ICustomer>({
    gender: { type: String, enum: Gender, optional: true },
    age: { type: Number, optional: true },
    email: { type: String, optional: true },
    satisfaction: { type: Number, optional: true }
});

const saleSchema = new Schema<ISale>({
    saleDate: { type: String, required: true },
    items: [{
        name: String,
        price: Number,
        quantity: Number
    }],
    storeLocation: { type: String, required: true },
    customer: {
        type: customerSchema,
        optional: true
    },
    couponUsed: { type: Boolean, optional: true }, 
    purchaseMethod: { 
        type: String, 
        enum: PurchaseMethod, 
        default: PurchaseMethod.InStore, 
        optional: true 
    }
});

const Sale = model<ISale>('Sale', saleSchema);
const Item = model<IItem>('Item', itemSchema);
const Customer = model<ICustomer>('Customer', customerSchema);


describe("CRUD ops", () => {
    it('connect', async() => {
        expect(await connect('http://localhost:8080'));
    });
    
    it('delete all', async() => {
        expect(await Sale.deleteMany());
        expect(await Sale.count()).equal(0);
    }).timeout(3000);
    
    it('save', async() => {
        const sale = new Sale({
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
        console.log("_id: " + sale._id + " t: " + typeof sale._id);
        expect(sale._id).exist;
        expect(sale._id).to.be.a('object');
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.saleDate).equal(sale.saleDate);
        expect(dbSale.storeLocation).equal(sale.storeLocation);
        expect(dbSale.purchaseMethod).equal(PurchaseMethod.InStore);
        expect(dbSale.items.length).equal(sale.items.length);
        expect(dbSale.items[0].name).equal(sale.items[0].name);
        expect(dbSale.items[0].price).equal(sale.items[0].price);
        expect(dbSale.items[0].quantity).equal(sale.items[0].quantity);
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
                    gender: Gender[r % 2],
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
    });
    
    it('simple query', async () => {
        let allSales = await Sale.find();
        expect(allSales).to.be.an('array');
        expect(allSales.length).equal(noOfRows);
        for (let sale of allSales) {
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.oneOf(cities);
        }
    });

    it('query filter', async () => {
        
        // Q: SELECT * FROM sales t WHERE ((t.kvjson."storeLocation"[] =any "NY"))
        let allSales = await Sale.find({'storeLocation': 'NY'});

        expect(allSales).to.be.an('array');
        expect(allSales.length).to.be.greaterThan(0);
        for (let sale of allSales) {
            console.log(sale);
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.equal('NY');
        }
    });

    // it('query filter nested',async () => {
    //     // todo Q: SELECT * FROM sales t WHERE ((t.kvjson."items.quantity" >= 10))
    //     let allSales = await Sale.find({'items.quantity': {$gte: 10}});
    //     expect(allSales).to.be.an('array');
    //     expect(allSales.length).equal(noOfRows);
    //     for (let sale of allSales) {
    //         console.log(JSON.stringify(sale));
    //         expect(sale.items[0].name).to.be.oneOf(itemNames);
    //         expect(sale.storeLocation).to.be.oneOf(cities.filter(v => v.length > 2));
    //     }
    // });

    // it('',async () => {
        
    // });

    // it('',async () => {
        
    // });

    // it('',async () => {
        
    // });
});