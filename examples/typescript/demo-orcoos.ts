//const moogose = require('mongoose');
// const orcoos = require('orcoos');
import orcoos from 'orcoos';

// mongoose.set('strictQuery', false);
orcoos.set('strictQuery', false);

//import { Schema, model, connect } from 'mongoose';
import { Schema, model, connect } from 'orcoos';

// 1. Create an interface representing a document in MongoDB.
interface IUser {
    name: string;
    email: string;
    avatar?: string;
    age?: number;
    dateAdded?: Date;
    dept?: string;
    hq: IAddress;
    offices: IAddress[];
}

interface IAddress {
    city: string;
    street: string;
    codes: number[];
    extra?: any;
}
  
// 2. Create a Schema corresponding to the document interface.
const addressSchema = new Schema<IAddress>({
    city: String,
    street: String,
    codes: [Number],
}, {autoCreate: false});

const userSchema = new Schema<IUser>({
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
const User = model<IUser>('User', userSchema);
const Address = model<IAddress>('Address', addressSchema);


run().catch(err => console.log(err));

async function run() {
    // 4. Connect to NoSQL DB1
    console.log("Connecting to DB ...");
    //await connect('mongodb://localhost');
    await connect('nosqldb+on_prem+http://localhost:8080');
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
    let savedUserId: any;
    let names = ["Al", "Bo", "Yo", "Jo", "Ax"];
    let cities = ["LA", "NY", "SF", "London", "Paris"];
    console.log("\nrandom r= " + r + "  age= " + age + " code= " + code);
    
    for( let name of names) {
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
          hq: new Address({city: cities[r%5], codes: [code]}),
          offices: [
            new Address({city: cities[(r+1)%5]}),
            new Address({city: cities[(r+2)%5], codes: [1, 2, code]})
          ]
        });
        console.log("user.save()");
        let savedUser = await user.save();
    
        console.log("  savedUser._id: " + savedUser._id + " " + savedUser.name);
        savedUserId = savedUser._id;
    };

    console.log("\n\nUser.findById()");
    let savedUser = await User.findById(savedUserId);
    console.log("  User: " + savedUser);


    console.log("\n\nUser.find()");
    let users = await User.find();
    users.forEach( function (u:IUser) { 
        console.log("  user: " + u.name + "  " + u.age + "   " + u.dept + " " + JSON.stringify(u.dateAdded)); 
    });


        
    console.log("\n\nUser.find({age: {$gte: 18}})");
    let bills = await User.find({age: {$gte: 18}});
    bills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + u.email + "   age: " + u.age));


    //Tank.find({ size: 'small' }).where('createdDate').gt(oneYearAgo).exec(callback);
    console.log(`\n\nUser.find({dept: 'eng'}).where('age', ${age})`);
    let billsWithMyAge = (await User.find({dept: 'eng'}).where('age', age));
    billsWithMyAge.forEach((u:IUser) => console.log("  user: " + u.name + "  " + u.dept + " age: " + u.age + "   " + JSON.stringify(u.dateAdded)));


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
    let nyBills = (await User.find({'hq.city': "NY"})/*.where('age', age)*/);
    nyBills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + u.dept + " age: " + u.age + "   " + JSON.stringify(u.dateAdded)));

    
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

    if(!savedUser) {
        return;
    }

    // updateOne filter must contain _id
    console.log(`\n\nUser.updateOne:  savedUser.updateOne({$inc: {age: 1}})  age was: ` + savedUser.age);
    //let upd = await User.updateOne({_id: savedUser._id}, {$set: {age: 20}});
    let upd = await savedUser.updateOne({$inc: {age: 1}});
    let updUser = await User.findById(savedUser._id);
    console.log(`   updated user: ` + JSON.stringify(upd) + `\n      ` + JSON.stringify(updUser?.age));


    // updateMany filter must contain _id
    console.log(`\n\nUser.updateMany({_id: savedUser._id}, {$unset: {avatar: 20}})`);
    let updMany = await User.updateMany({_id: savedUser._id}, {$unset: {avatar: ""}});
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
    console.log("\n\n User.nosqlQuery(\"select * from users\)")
    let nqUsers = await User.nosqlQuery("select * from users");
    nqUsers.forEach((u:IUser) => console.log(`user: ${u.name} email: ${u.email} age: ${u.age}`));

    // NoSQL DB custom query returning nested structure
    console.log("\n\n Model.nosqlQuery(\"select t.kvjson.hq.city, count(*) from...")
    let hqs = await Address.nosqlQuery("select t.kvjson.hq.city as city, [t.kvjson.hq.codes[]] as codes from users t");
    hqs.forEach((hq:IAddress) => console.log(`  hq: ${JSON.stringify(hq)} `));


    // Count and deleteMany with filter
    console.log("\n\n User.count())")
    let count = await User.count();
    console.log("       count: " + count);

    console.log("\n\n User.deleteMany({age: {$lte: 78}}")
    let delM = await User.deleteMany({age: {$gte: 78}});
    console.log("       deletions: " + delM);

    console.log("\n\n User.count())")
    count = await User.count();
    console.log("       count: " + count);

    console.log("\n\nUser.find()");
    let users2 = await User.find();
    users2.forEach( function (u:IUser) { 
         console.log("  user: " + u.name + "  " + u.email + "   " + u.age); 
    });
}
