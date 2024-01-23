"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//const orcoos = require('mongoose');
//const orcoos = require('orcoos');
const orcoos_1 = __importDefault(require("orcoos"));
// mongoose.set('strictQuery', false);
orcoos_1.default.set('strictQuery', false);
//import { Schema, model, connect } from 'mongoose';
const orcoos_2 = require("orcoos");
// 2. Create a Schema corresponding to the document interface.
const addressSchema = new orcoos_2.Schema({
    city: String,
    street: String,
    codes: [Number],
}, { autoCreate: false });
const userSchema = new orcoos_2.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: String,
    age: Number,
    dateAdded: Date,
    dept: String,
    hq: addressSchema,
    offices: [addressSchema],
});
// 3. Create a Model.
const User = (0, orcoos_2.model)('User', userSchema);
const Address = (0, orcoos_2.model)('Address', addressSchema);
run().catch(err => console.log(err));
async function run() {
    // 4. Connect to NoSQL DB1
    console.log("Connecting to DB ...");
    //await connect('mongodb://localhost');
    await (0, orcoos_2.connect)('http://localhost:8080');
    console.log("    ... done.");
    // let now = Date.now();
    // let r = Math.round(1000 * Math.random());
    // let age = r % 100;
    // console.log("\nrandom r= " + r + "  age= " + age);
    // console.log("\nuser = new User...");    
    // const user = new User({
    //   name: 'Bill_' + r,
    //   email: 'bill@initech.com_' + r,
    //   avatar: 'https://tech.com/bill.png_' + r,
    //   age: age,
    //   dateAdded: now,
    //   dept: "eng",
    //   hq: new Address({city: "NY", codes: [age]}),
    //   offices: [
    //     new Address({city: "London"}),
    //     new Address({city: "LA", codes: [1,2, age]})
    //   ]
    // });
    // console.log("user.save()");
    // let savedUser = await user.save();
    // console.log("  savedUser._id: " + savedUser._id);
    // console.log("\n\nUser.findById()");
    // let bill = await User.findById(savedUser._id);
    // console.log("  Bill: " + bill);
    console.log("\n\nUser.find()");
    let users = await User.find();
    users.forEach(function (u) {
        console.log("  user: " + u.name + "  " + u.age + "   " + u.dept + " " + JSON.stringify(u.dateAdded));
    });
    // Nested structures and arrays
    // find path no arrays
    //   .find({'hq.city': 'NY'}); 
    //   select * from users t where t.kvjson."hq"."city" = "NY";
    // find path last is an array
    //   .find({'hq.codes': 48});   
    //   select * from users t where t.kvjson."hq"."codes"[] =any 48;
    // find path through array
    //   .find({'offices.city': 'Io'}); 
    //   select * from users t where t.kvjson."offices"[]."city" =any "Io"; 
    // find path through arrays 2
    //   .find({'offices.codes': 0});   
    //      select * from users t where t.kvjson."offices"[]."codes"[] =any 0;
    //      select * from users t where t.kvjson."offices"."codes"[] =any 0;
    // find certain index in array
    //   find({"offices.codes.2": 88})
    //   select * from users t where t.kvjson."offices"[]."codes"[2] = 88;
    // find path with array of certain length
    //   .find({"offices.codes": {$size: 3}})
    //   select * from users t where exists t.kvjson."offices"[].codes[] and size([t.kvjson."offices"[].codes[]]) = 3;
    //   select * from users t where size([t.kvjson."offices"[].codes[]]) = 3;
    // find path with array that contains all the specified elements
    //   .find({"offices.codes": {$all: [2, 1, 48]}})
    //   ???
    // find path with condition on array index
    //   - no possition operator
    //   select * from users t where [t.kvjson."offices"[].codes[]][$pos > 0 and $pos < 2] = 2
    console.log(`\n\nUser.find({'hq.city': "NY"})`);
    let nyBills = (await User.find({ 'hq.city': "NY" }) /*.where('age', age)*/);
    nyBills.forEach((u) => console.log("  user: " + u.name + "  " + "  hq.city: " + u.hq.city));
    console.log(`\n\nUser.find({'hq.codes': 77})`);
    let hqcodesBills = (await User.find({ 'hq.codes': 77 }));
    hqcodesBills.forEach((u) => console.log("  user: " + u.name + "  " + "  hq.codes: " + JSON.stringify(u.hq.codes)));
    console.log(`\n\nUser.find({'offices.city': "London"})`);
    let londonBills = (await User.find({ 'offices.city': "London" }));
    londonBills.forEach((u) => console.log("  user: " + u.name + "  " + "  offices[0].city: " + u.offices[0].city));
    console.log(`\n\nUser.find({'offices.codes': 77})`);
    let ioBills = await User.find({ 'offices.codes': 77 });
    ioBills.forEach((u) => console.log("  user: " + u.name + "  " + "  offices[1].codes: " + JSON.stringify(u.offices[1].codes)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGJnLWZpbmQtbmVzdGVkU3RydWN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2RiZy1maW5kLW5lc3RlZFN0cnVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxQ0FBcUM7QUFDckMsbUNBQW1DO0FBQ25DLG9EQUE0QjtBQUU1QixzQ0FBc0M7QUFDdEMsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRWpDLG9EQUFvRDtBQUNwRCxtQ0FBZ0Q7QUFxQmhELDhEQUE4RDtBQUM5RCxNQUFNLGFBQWEsR0FBRyxJQUFJLGVBQU0sQ0FBVztJQUN2QyxJQUFJLEVBQUUsTUFBTTtJQUNaLE1BQU0sRUFBRSxNQUFNO0lBQ2QsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDO0NBQ2xCLEVBQUUsRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUV4QixNQUFNLFVBQVUsR0FBRyxJQUFJLGVBQU0sQ0FBUTtJQUNqQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7SUFDdEMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0lBQ3ZDLE1BQU0sRUFBRSxNQUFNO0lBQ2QsR0FBRyxFQUFFLE1BQU07SUFDWCxTQUFTLEVBQUUsSUFBSTtJQUNmLElBQUksRUFBRSxNQUFNO0lBQ1osRUFBRSxFQUFFLGFBQWE7SUFDakIsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO0NBQzNCLENBQUMsQ0FBQztBQUVILHFCQUFxQjtBQUNyQixNQUFNLElBQUksR0FBRyxJQUFBLGNBQUssRUFBUSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDOUMsTUFBTSxPQUFPLEdBQUcsSUFBQSxjQUFLLEVBQVcsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRzFELEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FB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