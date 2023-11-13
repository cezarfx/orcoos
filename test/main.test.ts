import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { Schema, model, connect } from '../index';


// 1. Create an interface representing a document in MongoDB.
interface ISale {
    //_id?: any;
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


describe("CRUD and query operations", () => {
    it('connect', async() => {
        expect(await connect('http://localhost:8080'));
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
        expect(dbSale.saleDate).equal(sale.saleDate);
        expect(dbSale.storeLocation).equal(sale.storeLocation);
        expect(dbSale.purchaseMethod).equal(PurchaseMethod.InStore);
        expect(dbSale.items.length).equal(sale.items.length);
        expect(dbSale.items[0].name).equal(sale.items[0].name);
        expect(dbSale.items[0].price).equal(sale.items[0].price);
        expect(dbSale.items[0].quantity).equal(sale.items[0].quantity);
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
    });

    it('query filter', async () => {
        // Q: SELECT * FROM sales t WHERE ((t.kvjson."storeLocation"[] =any "NY"))
        let allSales = await Sale.find({'storeLocation': 'NY'});

        expect(allSales).to.be.an('array');
        expect(allSales.length).to.be.greaterThan(0);
        for (let sale of allSales) {
            // console.log(sale);
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.equal('NY');
        }
    });

    it('query filter nested', async () => {
        // Q: SELECT * FROM sales t WHERE ((t.kvjson."items"[]."quantity"[] >= 10));
        let allSales = await Sale.find({'items.quantity': {$gte: 10}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.oneOf(cities.filter(v => v.length > 2));
            expect(sale.items[0].quantity).greaterThanOrEqual(10);
        }
    });

    it('query filter and where', async () => {
        // todo Q: SELECT * FROM sales t WHERE ((t.kvjson."items.quantity" <= 10) AND (t.kvjson."storeLocation"[] =any "NY"))
        let allSales = await Sale.find({'items.quantity': {$lte: 10}}).where({storeLocation: 'NY'});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.equal('NY');
            expect(sale.items[0].quantity).lessThanOrEqual(10);
        }
    });

    it('query filter by array size', async () => {
        // Q: SELECT * FROM sales t WHERE (( size([t.kvjson."items"[]]) = 1 ))
        let allSales = await Sale.find({'items': {$size: 1}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            expect(sale.items.length).equal(1);
        }
    });

    it('query filter nested non array', async () => {
        // Q: SELECT * FROM sales t WHERE ((t.kvjson."customer"[]."gender"[] =any "F"))
        let allSales = await Sale.find({'customer.gender': 'F'});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            expect(sale.customer.gender).equal('F');
        }
    });

    it('updateOne', async () => {
        // .put(table, row)
        await sale.updateOne({$set: {storeLocation: 'NY:NY'}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.storeLocation).equal('NY:NY');
    });
    // todo add tests for rest of oprations: $unset, $min, $max, $inc, $mul, $currentDate

    it('updateOne not saved', async () => {
        let newSale = new Sale({
            saleDate: new Date(),
            items: [],
            storeLocation: "Rome"
        });
        await newSale.updateOne({$set: {storeLocation: 'Rome:Italy'}});
        let updSale = await Sale.findById(newSale._id);
        expect(updSale).not.exist;
    });

    it('updateMany fail', async () => {
        expect(Sale.updateMany({$inc: {'customer.age': 1}}))
            .to.be.eventually.rejectedWith("updateMany() filter param doesn't contain _id field.");
    });

    it('replaceOne', async () => {
        let dbSale = await Sale.findById(sale._id);
        // .putIfPresent
        let replaced = await dbSale.replaceOne(new Sale({
            saleDate: new Date(),
            items: [new Item({
                name: "beads",
                price: 2.23,
                quantity: 2
            })],
            storeLocation: "Bloom",
            customer: {
                satisfaction: 4
            }
        }));

        expect(replaced.matchedCount).equal(1);
        expect(replaced.modifiedCount).equal(1);
        expect(replaced.acknoledged).equal(true);
        expect("" + replaced.upsertedId).equal("" + sale._id);
        // expect(replaced.upsertedCount).equal(1);

        sale = await Sale.findById(dbSale._id);
        expect(sale.storeLocation).equal('Bloom');
        expect(sale.items[0].name).equal('beads');
        expect(sale.items[0].price).equal(2.23);
        expect(sale.items[0].quantity).equal(2);
    });
    
    it('findOneAndUpdate $unset nested', async () => {
        // Q: UPDATE sales AS t  REMOVE t.kvjson."customer"[]."satisfaction"[] WHERE (t.kvid = "655...") RETURNING *
        let updated = await Sale.findOneAndUpdate(sale._id, {$unset: {"customer.satisfaction": ""}});
        expect(updated.storeLocation).equal(sale.storeLocation);
        expect(updated.items[0].name).equal(sale.items[0].name);
        expect(updated.customer.satisfaction).to.be.undefined;
    });
    
    it('findOneAndUpdate $set unnested', async () => {
        // Q: UPDATE sales AS t  SET t.kvjson."storeLocation"[] = "Miami" WHERE (t.kvid = "655...") RETURNING *
        let updated = await Sale.findOneAndUpdate(sale._id, {$set: {storeLocation: 'Miami'}});
        expect(updated.storeLocation).equal('Miami');
        expect(updated.items[0].name).equal(sale.items[0].name);

        // check row is udated in DB
        sale = await Sale.findById(sale._id);
        expect(sale.storeLocation).equal('Miami');
        expect(sale.items[0].name).equal(updated.items[0].name);
    });
     
    //todo: add rest of operators: $currentDate, $min, $max, $inc, $mul, $rename
    
    // Nested set doesn't work!
    // it('findOneAndUpdate set nested', async () => {
    //     // Q: UPDATE sales AS t  REMOVE t.kvjson."customer"[]."satisfaction"[] WHERE (t.kvid = "65525be2700feb6eab92af4b") RETURNING *
    //     let updated = await Sale.findOneAndUpdate(sale._id, {$set: {"customer.satisfaction": 5}});
    //     expect(updated.storeLocation).equal(sale.storeLocation);
    //     expect(updated.items[0].name).equal(sale.items[0].name);
    //     expect(updated.customer.satisfaction).equal(5);
    // });
    
    it('findOneAndDelete', async () => {
        // Q: DELETE FROM sales t WHERE (t.kvid = "6552684c63f61bfd2f25a638") RETURNING *
        let res = await Sale.findOneAndDelete(sale._id);
        expect('' + res._id).equal('' + sale._id);

        let dbSale = await Sale.findById(sale._id);
        expect(dbSale).to.be.null;
    });

    it('deleteOne', async () => {
        // .delete(table, kdid)
        // delete an already deleted row
        let res = await Sale.deleteOne({_id: sale._id});
        expect(res).to.be.false;

        // delete an existing row
        res = await Sale.deleteOne({_id: allExpectedSales[0]._id});
        expect(res).to.be.true;

        // check row is deleted in the DB
        let dbSale = await Sale.findById(allExpectedSales[0]._id);
        expect(dbSale).to.be.null;
        allExpectedSales.splice(0, 1);
    });

    it('Custom query: nosqlQuery', async () => {
        let dbSales = await Sale.nosqlQuery('SELECT * FROM Sales ORDER BY kvid');
        for(let i in dbSales) {
            // console.log(" " + i + " " + dbSales[i]);
            expect('' + dbSales[i]._id).equal('' + allExpectedSales[i]._id);
            expect(dbSales[i].storeLocation).equal(allExpectedSales[i].storeLocation);
            expect(dbSales[i].customer.email).equal(allExpectedSales[i].customer.email);
            expect(dbSales[i].customer.age).equal(allExpectedSales[i].customer.age);
            expect(dbSales[i].items[0].name).equal(allExpectedSales[i].items[0].name);
        }
        expect(dbSales.length).equal(allExpectedSales.length);
    });

    it('Custom query returning nested structure',async () => {
        let q = 'SELECT t.kvjson.customer.age as age, t.kvjson.customer.email as email, t.kvjson.customer.gender as gender FROM sales t ORDER BY t.kvid';
        let customers = await Customer.nosqlQuery(q);
        for(let i in customers) {
            // console.log(" " + i + " " + customers[i]);
            expect(customers[i].age).equal(allExpectedSales[i].customer.age);
            expect(customers[i].email).equal(allExpectedSales[i].customer.email);
            expect(customers[i].gender).equal(allExpectedSales[i].customer.gender);
        }
    });

    it('count',async () => {
        let c = await Sale.count();
        expect(c).equal(allExpectedSales.length);
    });

    it('deleteMany filter', async () => {
        // Q: DELETE FROM sales t WHERE ((t.kvjson."items"[]."price"[] >= 60))
        let delM = await Sale.deleteMany({"items.price": {$gte: 60}});
        // console.log("       deletions: " + delM);
        expect(delM).lessThanOrEqual(allExpectedSales.length);
        expect(delM).greaterThanOrEqual(0);

        // Q: SELECT * FROM sales t WHERE ((t.kvjson."items"[]."price"[] >= 60))
        let dbSales = await Sale.find({'items.price': {$gte: 60}})
        expect(dbSales).to.be.empty;

        allExpectedSales.splice(0, delM);
    });

    it('deleteMany unfiltered all', async () => {
        // Q: DELETE FROM sales t
        let delM = await Sale.deleteMany();
        console.log("       deletions: " + delM);
        expect(delM).lessThanOrEqual(allExpectedSales.length);
        expect(delM).greaterThanOrEqual(0);

        // Q: SELECT * FROM sales t
        let dbSales = await Sale.find()
        expect(dbSales).to.be.empty;

        // Q: SELECT count(*) FROM sales t
        let dbCount = await Sale.count();
        expect(dbCount).equal(0);
    });
});