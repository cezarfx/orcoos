"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//const moogose = require('mongoose');
// const ondbmongoose = require('ondbmongoose');
const orcoos_1 = __importDefault(require("ondbmongoose"));
// mongoose.set('strictQuery', false);
orcoos_1.default.set('strictQuery', false);
//import { Schema, model, connect } from 'mongoose';
const orcoos_2 = require("ondbmongoose");
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
    // Delete all users
    console.log("\nCount users: ");
    console.log("  > " + await User.count());
    console.log("\nDelete all users");
    await User.deleteMany({});
    console.log("\nCount users: ");
    console.log("  > " + await User.count());
    // Insert new users
    let now = Date.now();
    let r;
    let age;
    let code;
    let savedUserId;
    let names = ["Al", "Bo", "Yo", "Jo", "Ax"];
    let cities = ["LA", "NY", "SF", "London", "Paris"];
    console.log("\nrandom r= " + r + "  age= " + age + " code= " + code);
    for (let name of names) {
        r = Math.round(1000 * Math.random());
        age = r % 100;
        code = (r % 100) * 1000;
        console.log("\nuser = new User...");
        const user = new User({
            name: name,
            email: name + '@e.com',
            avatar: 'http://e.com/' + name + '.png',
            age: age,
            dateAdded: now,
            dept: "eng",
            hq: new Address({ city: cities[r % 5], codes: [code] }),
            offices: [
                new Address({ city: cities[(r + 1) % 5] }),
                new Address({ city: cities[(r + 2) % 5], codes: [1, 2, code] })
            ]
        });
        console.log("user.save()");
        let savedUser = await user.save();
        console.log("  savedUser._id: " + savedUser._id + " " + savedUser.name);
        savedUserId = savedUser._id;
    }
    ;
    console.log("\n\nUser.findById()");
    let savedUser = await User.findById(savedUserId);
    console.log("  User: " + savedUser);
    console.log("\n\nUser.find()");
    let users = await User.find();
    users.forEach(function (u) {
        console.log("  user: " + u.name + "  " + u.age + "   " + u.dept + " " + JSON.stringify(u.dateAdded));
    });
    console.log("\n\nUser.find({age: {$gte: 18}})");
    let bills = await User.find({ age: { $gte: 18 } });
    bills.forEach((u) => console.log("  user: " + u.name + "  " + u.email + "   age: " + u.age));
    //Tank.find({ size: 'small' }).where('createdDate').gt(oneYearAgo).exec(callback);
    console.log(`\n\nUser.find({dept: 'eng'}).where('age', ${age})`);
    let billsWithMyAge = (await User.find({ dept: 'eng' }).where('age', age));
    billsWithMyAge.forEach((u) => console.log("  user: " + u.name + "  " + u.dept + " age: " + u.age + "   " + JSON.stringify(u.dateAdded)));
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
    console.log(`\n\nUser.find({hq: {city: "NY"}})`);
    let nyBills = (await User.find({ 'hq.city': "NY" }) /*.where('age', age)*/);
    nyBills.forEach((u) => console.log("  user: " + u.name + "  " + u.dept + " age: " + u.age + "   " + JSON.stringify(u.dateAdded)));
    // todo Projection
    // include only fields specified
    //     .find({}, {_id:0, name: 1, email: 1});  ->  { name: 'Bill_800', email: 'bill@initech.com_800' }
    //     select {"name": t.kvjson.name, "email": t.kvjson.email} from users t WHERE exists t.kvjson.name or exists t.kvjson.email;
    // include nested fields
    //     .find({}, {_id:0, "hq.city": 1, "hq.codes":1})   
    //     .find({}, {_id:0, hq: {city: 1, codes:1})      ->  { hq: { city: 'NY', codes: [ 0 ] } }
    //     select {"hq": {"city": t.kvjson.hq.city, "codes": t.kvjson.hq.codes[]} } from users t where exists t.kvjson.hq.city or exists t.kvjson.hq.codes[];
    // include everything but specified fields - ie exclude
    //     .find({}, {_id:0, hq:0, offices:0})   ->    { name:..., email:...}
    //     select {"name": t.kvjson.name, "email": t.kvjson.email, ... } from users t
    // include everything but nested fields - ie exclude subtrees
    //     .find({}, {_id:0, hq:{codes: 0}, offices:0})  -> {name:, email:, hq: {city: }}
    //     select {"name": .., "email": .., "hq": {"city": t.kvjson."hq"."city"} } from users t where exists ...;
    // include everything but nested fields with arrays - ie exclude
    //     .find({}, {_id:0, hq: 0, offices: {cities: 0}})
    //     select {"offices": {"codes": t.kvjson.offices[].codes[]}} from users t where exists t.kvjson.offices[];
    // Array Slice projection
    // project everything but from offices.codes include only the first 2 items
    //     .find({}, {"offices.codes": {$slice: 2}})
    //     select {"_id": t.kvid, "offices": {"codes": t.kvjson."offices"[].codes[0:1]}} from users t where exists t.kvjson."offices"[].codes[0:1]
    // try seq_transform or array_collect
    // project everything but from offices.codes include only the items from pos x to pos y
    //     .find({}, {"offices.codes": {$slice: [1,1]}})
    //     select {"_id": t.kvid, "offices": {"codes": t.kvjson."offices"[].codes[1:5]}} from users t where exists t.kvjson."offices"[].codes[1:1]
    // project size of array
    //     .find({}, {offices: {codes_size: {$size: "$offices.codes"}}}) 
    //           -> { _id: ..., offices: [ { codes_size: 0 }, { codes_size: 3 } ]}
    //     select {"_id": t.kvid, "offices": {"codes_size": size([t.kvjson."offices"[].codes[]])}} from users t where exists t.kvjson."offices"[].codes[]
    //           ->  {"_id" : ..., "offices" : {"codes_size" : 3 } }     !!! Diferent answer
    // find index for a certain condition inside the array item
    //   .aggregate([{ $project: {index: {$indexOfArray: ["$hq.codes", 88]}}}])
    //   select  from users t where [t.kvjson."offices"[].codes[]][2] = 88;
    //   .aggregate([{ $project: {index: {$indexOfArray: ["$offices.codes", 88]}}}])  // doesn't work
    //   select size([t.kvjson."offices"[].codes[]]) from users t where exists t.kvjson."offices"[].codes[] ;
    // // Todo Indexes  
    // console.log("\n\n--- Indexes ---\n     UserSchema.indexes(): " + userSchema.indexes());
    // userSchema.index({name: 1, age: 1});
    // // create index if not exists idx1 on users (kvjson.name as string , kvjson.age as number);
    // // !!! This will allow only inserts that have name as string and age as number. To allow any the index must use ANYATOMIC. !!!
    // userSchema.index({"hq.city": 1, "offices.codes": 1}/*, {unique: true}*/);
    // // create index if not exists idx2 on users (kvjson.hq.city as ANYATOMIC , kvjson.oficess[].codes[] as number);
    // console.log("     index UserSchema.indexes(): " + JSON.stringify(userSchema.indexes()));
    // // > db.users.getIndexes()
    // // [ { v: 2, key: { _id: 1 }, name: '_id_' } ]
    // User.createIndexes();        // creates indexes in db
    // // > db.users.getIndexes()
    // // [{ v: 2, key: { _id: 1 }, name: '_id_' },
    // // {
    // //     v: 2,
    // //     key: { name: 1, age: 1 },
    // //     name: 'name_1_age_1',
    // //     background: true
    // // }, {
    // //     v: 2,
    // //     key: { 'hq.city': 1, 'offices.codes': 1 },
    // //     name: 'hq.city_1_offices.codes_1',
    // //     background: true
    // // }]
    // userSchema.clearIndexes();
    // console.log("     clear UserSchema.indexes(): " + JSON.stringify(userSchema.indexes()));
    // User.ensureIndexes();   // loads from db
    // console.log("     ensure UserSchema.indexes(): " + JSON.stringify(userSchema.indexes()));
    // User.syncIndexes();     // removes from db
    // console.log("     sync UserSchema.indexes(): " + JSON.stringify(userSchema.indexes()));
    if (!savedUser) {
        return;
    }
    // updateOne filter must contain _id
    console.log(`\n\nUser.updateOne:  savedUser.updateOne({$inc: {age: 1}})  age was: ` + savedUser.age);
    //let upd = await User.updateOne({_id: savedUser._id}, {$set: {age: 20}});
    let upd = await savedUser.updateOne({ $inc: { age: 1 } });
    let updUser = await User.findById(savedUser._id);
    console.log(`   updated user: ` + JSON.stringify(upd) + `\n      ` + JSON.stringify(updUser?.age));
    // updateMany filter must contain _id
    console.log(`\n\nUser.updateMany({_id: savedUser._id}, {$unset: {avatar: 20}})`);
    let updMany = await User.updateMany({ _id: savedUser._id }, { $unset: { avatar: "" } });
    updUser = await User.findById(savedUser._id);
    console.log(`   updated user: ` + JSON.stringify(updMany) + `\n     ` + JSON.stringify(updUser));
    // console.log(`\n\nUser.replaceOne(...)`);
    // //let rep = await savedUser.replaceOne({name: "Phil", age: 25});
    // let rep = await savedUser.replaceOne(new User({
    //     name: 'Phil_' + (r - 10),
    //     age: age - 10,
    //     dept: "eng"
    //     }));
    // let repUser = await User.findById(savedUser._id);
    // console.log(`   replaced user: ` + JSON.stringify(rep) + `\n      ` + JSON.stringify(repUser));
    // console.log(`\n\nUser.finfOneAndUpdate(...)`);
    // let foau = await User.findOneAndUpdate({_id: savedUser._id}, {$unset: {dept: ""}});
    // console.log(`   findOneAmdUpdate user: ` + foau);
    // console.log(`   find again: ` + JSON.stringify(await User.findById(savedUser._id)));
    // console.log(`\n\nUser.finfOneAndDelete(...)`);
    // let foad = await User.findOneAndDelete({_id: savedUser._id});
    // console.log(`   findOneAmdDelete user: ` + foad);
    // console.log(`   find again: ` + JSON.stringify(await User.findById(savedUser._id)));
    console.log("\n\nuser.deleteOne()");
    let delRes = await savedUser.deleteOne();
    console.log("   result: " + delRes);
    // console.log("\n\nUser.findById()");
    // let delBill = await User.findById(savedUser._id);
    // console.log("  Deleted Bill: " + delBill);
    // console.log("\n\nUser.find()");
    // let users2 = await User.find();
    // users2.forEach( function (u:IUser) { 
    //     console.log("  user: " + u.name + "  " + u.email + "   " + u.avatar); 
    // });
    // NoSQL DB custom query
    console.log("\n\n User.nosqlQuery(\"select * from users\)");
    let nqUsers = await User.nosqlQuery("select * from users");
    nqUsers.forEach((u) => console.log(`user: ${u.name} email: ${u.email} age: ${u.age}`));
    // NoSQL DB custom query returning nested structure
    console.log("\n\n Model.nosqlQuery(\"select t.kvjson.hq.city, count(*) from...");
    let hqs = await Address.nosqlQuery("select t.kvjson.hq.city as city, [t.kvjson.hq.codes[]] as codes from users t");
    hqs.forEach((hq) => console.log(`  hq: ${JSON.stringify(hq)} `));
    // Count and deleteMany with filter
    console.log("\n\n User.count())");
    let count = await User.count();
    console.log("       count: " + count);
    console.log("\n\n User.deleteMany({age: {$lte: 78}}");
    let delM = await User.deleteMany({ age: { $gte: 78 } });
    console.log("       deletions: " + delM);
    console.log("\n\n User.count())");
    count = await User.count();
    console.log("       count: " + count);
    console.log("\n\nUser.find()");
    let users2 = await User.find();
    users2.forEach(function (u) {
        console.log("  user: " + u.name + "  " + u.email + "   " + u.age);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVtby1vcmNvb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kZW1vLW9yY29vcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHNDQUFzQztBQUN0QyxvQ0FBb0M7QUFDcEMsb0RBQTRCO0FBRTVCLHNDQUFzQztBQUN0QyxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFakMsb0RBQW9EO0FBQ3BELG1DQUFnRDtBQXdCaEQsOERBQThEO0FBQzlELE1BQU0sYUFBYSxHQUFHLElBQUksZUFBTSxDQUFXO0lBQ3ZDLElBQUksRUFBRSxNQUFNO0lBQ1osTUFBTSxFQUFFLE1BQU07SUFDZCxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUM7Q0FDbEIsRUFBRSxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0FBRXhCLE1BQU0sVUFBVSxHQUFHLElBQUksZUFBTSxDQUFRO0lBQ2pDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtJQUN0QyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7SUFDdkMsTUFBTSxFQUFFLE1BQU07SUFDZCxHQUFHLEVBQUUsTUFBTTtJQUNYLFNBQVMsRUFBRSxJQUFJO0lBQ2YsSUFBSSxFQUFFLE1BQU07SUFDWixFQUFFLEVBQUUsYUFBYTtJQUNqQixPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUM7Q0FDM0IsQ0FBQyxDQUFDO0FBRUgscUJBQXFCO0FBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUEsY0FBSyxFQUFRLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM5QyxNQUFNLE9BQU8sR0FBRyxJQUFBLGNBQUssRUFBVyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFHMUQsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMs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