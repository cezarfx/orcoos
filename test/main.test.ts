import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import {ISale, Sale, Item, Customer, PurchaseMethod, Gender} from './sale';

describe("CRUD and query operations", () => {
    it('connect', async() => {
        expect(await connect('http://localhost:8080', {debug: 4}));
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
    let tags = ["white", "green", "red"];

    it('insertMany', async () => {
        let saleCount = await Sale.count();
        let r: number;
        
        let allSales: Array<ISale> = [];

        for( let [i, name] of names.entries()) {
            r = Math.round(1000 * Math.random());
  
            let city = cities[r % cities.length];
            const sale: ISale = new Sale<ISale>({
                saleDate: new Date(),
                items: [new Item({
                    name: itemNames[r % itemNames.length],
                    price: r/10,
                    quantity: r % 10 + (city.length > 2 ? 10 : 0),
                    tags: tags.slice(0, i % tags.length + 1)
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

    it('query filter {}', async () => {
        let allSales = await Sale.find({});
        expect(allSales).to.be.an('array');
        expect(allSales.length).equal(noOfRows);
        for (let sale of allSales) {
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.be.oneOf(cities);
        }
        expect(allSales.length).equal(allExpectedSales.length + 1);
    });
    
    it('query filter prop = value', async () => {
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

    it('query filter and .where', async () => {
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

    it('query filter $or', async () => {
        // Q: SELECT * FROM sales t WHERE ((((t.kvjson."items.quantity" < 10)) OR ((t.kvjson."items.quantity" > 10))))
        let allSales = await Sale.find({$or: [{'items.quantity': {$lt: 10}}, {'items.quantity': {$gt: 10}}]});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.items[0].quantity).to.satisfy((q: number) => q < 10 || q > 10);
        }
    });

    it('query filter $not', async () => {
        // Q: SELECT * FROM sales t WHERE ((((t.kvjson."items.quantity" < 10)) OR ((t.kvjson."items.quantity" > 10))))
        let allSales = await Sale.find({$not: {'items.quantity': {$lt: 10}}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.items[0].quantity).not.lessThan(10);
            expect(sale.items[0].quantity).greaterThanOrEqual(10);
        }
    });

    it('query filter $nor', async () => {
        // Q: SELECT * FROM sales t WHERE (NOT(((t.kvjson."items"."quantity" < 10)) OR ((t.kvjson."items"."quantity" > 10))))
        let allSales = await Sale.find({$nor: [{'items.quantity': {$lt: 10}}, {'items.quantity': {$gt: 10}}]});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.items[0].quantity).to.satisfy((q: number) => !(q < 10) && !(q > 10));
        }
    });

    it('query filter $or and $and', async () => {
        // Q: SELECT * FROM sales t WHERE ((((t.kvjson."items"."quantity" < 10)) OR ((t.kvjson."items"."quantity" > 10)) OR ((((t.kvjson."items"."quantity" > 10))))))
        let allSales = await Sale.find(
                {$or: [ {'items.quantity': {$lt: 10}}, 
                        {'items.quantity': {$gt: 10}},
                        {$and: [{'items.quantity': {$gt: 10}}]}
                      ] });
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.items[0].quantity).to.satisfy((q: number) => (q < 10 || q > 10 || q > 10));
        }
    });

    it('query filter $in', async () => {
        // Q: SELECT * FROM sales t WHERE ((t.kvjson."items"."name" IN ("wine","milk","beer","soda","tea") OR EXISTS (t.kvjson."items"."name"[$element IN ("wine","milk","beer","soda","tea")])))
        let allSales = await Sale.find(
                {'items.name': {$in: itemNames}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
        }
        expect(allSales.length).equal(allExpectedSales.length + 1);
    });

    it('query filter 1 field 2 conditions', async () => {
        // Q: SELECT * FROM sales t WHERE ((t.kvjson."storeLocation" = "NY") AND (t.kvjson."storeLocation" >= "NY"))
        let allSales = await Sale.find(
            {storeLocation: {$eq: "NY", $gte: "NY"}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.items[0].name).to.be.oneOf(itemNames);
            expect(sale.storeLocation).to.satisfy((sl: String) => (sl == "NY" && sl >= "NY"));
        }
        expect(allSales.length).greaterThanOrEqual(1);
    });

    it('query $regex', async () => {
        // Q: SELECT * FROM sales t WHERE (( regex_like(t.kvjson."customer"."email", ".*@.*","") )) 
        let allSales = await Sale.find(
            {'customer.email': {$regex: '.*@.*'}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.customer.email).to.satisfy((e: String) => (e.includes('@')));
        }
        expect(allSales.length).greaterThanOrEqual(5);
    });

    it('query $regex case insensitive', async () => {
        // Q: SELECT * FROM sales t WHERE (( regex_like(t.kvjson."customer"."email", "bo.*","is") ))
        let allSales = await Sale.find(
            {'customer.email': {$regex: 'bo.*', $options: 'is'}});
        expect(allSales).to.be.an('array');
        
        for (let sale of allSales) {
            // console.log(JSON.stringify(sale));
            expect(sale.customer.email).to.satisfy((e: String) => (e.toLowerCase().includes('bo') && e.toLowerCase().startsWith("bo")));
        }
        expect(allSales.length).greaterThanOrEqual(1);
    });

    //todo filter by null values or missing fields, $exists, by type of value


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

    // Deep equal
    // todo: this should work: {'customer': { gender: 'M', age: 47, email: 'em4@ai.l', satisfaction: 1 }
    // it('query filter nested non array 2', async () => {
    //     // Q: 
    //     let allSales = await Sale.find({'customer': {'gender': 'F'}});
    //     expect(allSales).to.be.an('array');
        
    //     for (let sale of allSales) {
    //         expect(sale.customer.gender).equal('F');
    //     }
    // });

    it('updateOne $set', async () => {
        // Q: UPDATE sales AS t  SET t.kvjson."storeLocation"[] = "NY:NY" WHERE (t.kvid = "...")
        await sale.updateOne({$set: {storeLocation: 'NY:NY'}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.storeLocation).equal('NY:NY');
    });

    it('updateOne $set nested', async () => {
        expect(sale.customer).to.not.exist;
        // Q: UPDATE sales AS t  PUT t.kvid {"customer": {"age": 23}} WHERE (t.kvid = "...")
        await sale.updateOne({$set: {'customer.age': 23}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.customer).to.be.not.empty;
        expect(updSale.customer.age).equal(23);
    });

    it('updateOne $unset', async () => {
        // Q: UPDATE sales AS t  REMOVE t.kvjson."customer" WHERE (t.kvid = "...")
        await sale.updateOne({$unset: {customer: ''}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.customer).to.not.exist;
    });

    it('updateOne $min', async () => {
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.items[0].price).equal(8.22);
        // Q: UPDATE sales AS t  SET t.kvjson."items"[0]."price" = CASE WHEN 5 < t.kvjson."items"[0]."price" THEN 5 ELSE t.kvjson."items"[0]."price" END WHERE (t.kvid = "...")
        await sale.updateOne({$min: {'items.0.price': 5}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.items[0].price).equal(5);
    });

    it('updateOne $max', async () => {
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.items[0].price).equal(5);
        // Q: UPDATE sales AS t  SET t.kvjson."items"[0]."price" = CASE WHEN 8.22 > t.kvjson."items"[0]."price" THEN 8.22 ELSE t.kvjson."items"[0]."price" END WHERE (t.kvid = "...")
        await sale.updateOne({$max: {'items.0.price': 8.22}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.items[0].price).equal(8.22);
    });

    it('updateOne $inc', async () => {
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.items[0].quantity).equal(4);
        // Q: UPDATE sales AS t  SET t.kvjson."items"[0]."quantity" = t.kvjson."items"[0]."quantity" + 4 WHERE (t.kvid = "...")
        await sale.updateOne({$inc: {'items.0.quantity': 4}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.items[0].quantity).equal(8);
    });
    
    it('updateOne $mul', async () => {
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.items[0].quantity).equal(8);
        // Q: UPDATE sales AS t  SET t.kvjson."items"[0]."quantity" = t.kvjson."items"[0]."quantity" * 0.5 WHERE (t.kvid = "...")
        await sale.updateOne({$mul: {'items.0.quantity': 0.5}});
        let updSale = await Sale.findById(sale._id);
        expect(updSale.items[0].quantity).equal(4);
    });
    
    it('updateOne', async () => {
        // Q: UPDATE sales AS t  SET t.kvjson."saleDate" = CAST (current_time() AS String) WHERE (t.kvid = "...")
        await sale.updateOne({$currentDate: {saleDate: true}});
        let updSale = await Sale.findById(sale._id);
        expect(Date.now() - new Date(updSale.saleDate).getTime()).lessThanOrEqual(2000);
    });
    
    it('updateOne: if no _id then not saved', async () => {
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
        // Q: UPDATE sales AS t  PUT t.kvjson {"storeLocation": "Miami"} WHERE (t.kvid = "656e07b43e61f21fbf3c516a") RETURNING *
        let updated = await Sale.findOneAndUpdate(sale._id, {$set: {storeLocation: 'Miami'}});
        expect(updated.storeLocation).equal('Miami');
        expect(updated.items[0].name).equal(sale.items[0].name);

        // check row is udated in DB
        sale = await Sale.findById(sale._id);
        expect(sale.storeLocation).equal('Miami');
        expect(sale.items[0].name).equal(updated.items[0].name);
    });
    
    it('findOneAndUpdate $set nested', async () => {
        // Q: UPDATE sales AS t  REMOVE t.kvjson."customer"[]."satisfaction"[] WHERE (t.kvid = "655...") RETURNING *
        let updated = await Sale.findOneAndUpdate(sale._id, {$set: {"customer.satisfaction": 5}});
        expect(updated.storeLocation).equal(sale.storeLocation);
        expect(updated.items[0].name).equal(sale.items[0].name);
        expect(updated.customer.satisfaction).equal(5);

        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.customer.satisfaction).to.exist;
        expect(dbSale.customer.satisfaction).equal(5);
    });
    
    it('findOneAndUpdate $rename nested', async () => {
        let dbSale = await Sale.findById(sale._id);
        expect(dbSale.customer.satisfaction).to.exist;
        expect(dbSale.customer.satisfaction).equal(5);
        expect(dbSale.customer.age).to.not.exist;
        // Q: UPDATE sales AS t  PUT t.kvjson."customer" {"age": t.kvjson."customer"."satisfaction"}, REMOVE t.kvjson."customer"."satisfaction" WHERE (t.kvid = "6578a3197cbd60ec0c147508") RETURNING *
        let updated = await Sale.findOneAndUpdate(sale._id, {$rename: {"customer.satisfaction": 'age'}});
        expect(updated.customer.satisfaction).to.not.exist;
        expect(updated.customer.age).to.exist;
        expect(updated.customer.age).equal(5);
    });
    
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

    // Not supported, matching inside a nested array on the same item: 
    // Sale.find({items: {$elemMatch: {
    //                      quantity: {$lt: 10},
    //                      tags: {$in: ["red", "green"]}
    //           }}});   
    // Q: SELECT * FROM sales t 
    //    WHERE (exists t.kvjson."items"[
    //                      $element.quantity < 10 
    //                  AND exists $element.tags[$element in ("red", "green")]]);        
    it('Custom query nested arrays', async () => {
        let q = 'SELECT * FROM sales t WHERE (' +
            ' exists t.kvjson."items"[ $element.quantity < 20 AND ' + 
            ' exists $element.tags[$element in ("red", "green")]])';
        let sales = await Sale.nosqlQuery(q);
        for(let i in sales) {
            //console.log(" " + i + " " + JSON.stringify(sales[i]));
            expect(sales[i].items[0].quantity).lessThan(20);
            expect(sales[i].items[0].tags).contains("green");
        }
        expect(sales.length).equal(3);
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
        // console.log("       deletions: " + delM);
        expect(delM).lessThanOrEqual(allExpectedSales.length);
        expect(delM).greaterThanOrEqual(0);

        // Q: SELECT * FROM sales t
        let dbSales = await Sale.find()
        expect(dbSales).to.be.empty;

        // Q: SELECT count(*) FROM sales t
        let dbCount = await Sale.count();
        expect(dbCount).equal(0);
    });

    // SELECT * FROM sales t WHERE ((t.kvjson."items"[]."price" > t.kvjson."items"[]."quamtity" + 60))
    // SELECT * FROM sales t WHERE ((t.kvjson."customer"."age" > t.kvjson."customer"."satisfaction" + 10))
    
    // SELECT * FROM sales t WHERE ((t.kvjson."customer"."age" > 18 and t.kvjson."customer"."satisfaction" > 9))
    // find( {$and: [{"customer.age}: {$gt: 18}}, {"customer.satisfaction": {$gt: 9}}]} )
});