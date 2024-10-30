/**
 *  Example shows how the Orcoos SDK is used instead of Mongoose.
 * 
 *  The following two lines should be updated and the rest of the code is unchenged. 
 */
// import mongoose, { Schema, model, connect } from 'mongoose';
// mongoose.set('strictQuery', false);
import orcoos, { Schema, model, connect} from 'orcoos';
orcoos.set('strictQuery', false);


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
    // await connect('mongodb://localhost');
    await connect('nosqldb+on_prem+http://localhost:8080', {logLevel: 3});
    console.log("    ... done.");


    // Delete all users
    console.log("\nCount users: ");
    console.log("  > " + await User.countDocuments());
    console.log("\nDelete all users");
    await User.deleteMany({});
    console.log("\nCount users: ");
    console.log("  > " + await User.countDocuments());


    // Insert new users
    let now = Date.now();

    let r = 1;
    let age = 20;
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
        // Save a user into DB
        console.log("user.save()");
        let savedUser = await user.save();
    
        console.log("  savedUser._id: " + savedUser._id + " " + savedUser.name);
        savedUserId = savedUser._id;
    };

    // Find a user by id
    console.log("\n\nUser.findById()");
    let savedUser = await User.findById(savedUserId);
    console.log("  User: " + savedUser);


    // Find all users
    console.log("\n\nUser.find()");
    let users = await User.find();
    users.forEach( function (u:IUser) { 
        console.log("  user: " + u.name + "  " + u.age + "   " + u.dept + " " + JSON.stringify(u.dateAdded)); 
    });

    // Find all users with age 18 or more
    console.log("\n\nUser.find({age: {$gte: 18}})");
    let bills = await User.find({age: {$gte: 18}});
    bills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + u.email + "   age: " + u.age));

    // Find all users in the eng department and a certain age.
    console.log(`\n\nUser.find({dept: 'eng'}).where('age', ${age})`);
    let billsWithMyAge = (await User.find({dept: 'eng'}).where('age', age));
    billsWithMyAge.forEach((u:IUser) => console.log("  user: " + u.name + "  " + u.dept + " age: " + u.age + "   " + JSON.stringify(u.dateAdded)));


    // Nested structures and arrays
    console.log(`\n\nUser.find({'hq.city': "NY"})`);
    let nyBills = (await User.find({'hq.city': "NY"}));
    nyBills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + u.dept + " age: " + u.age + "   " + JSON.stringify(u.dateAdded)));

    
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


    console.log(`\n\nUser.replaceOne(...)`);
    let rep = await savedUser.replaceOne(new User({
        name: 'Phil_' + (r - 10),
        age: age - 10,
        dept: "eng"
        }));
    let repUser = await User.findById(savedUser._id);
    console.log(`   replaced user: ` + JSON.stringify(rep) + `\n      ` + JSON.stringify(repUser));


    console.log(`\n\nUser.findOneAndUpdate(...)`);
    let foau = await User.findOneAndUpdate({_id: savedUser._id}, {$unset: {dept: ""}});
    console.log(`   findOneAmdUpdate user: ` + foau);
    console.log(`   find again: ` + JSON.stringify(await User.findById(savedUser._id)));


    console.log(`\n\nUser.finfOneAndDelete(...)`);
    let foad = await User.findOneAndDelete({_id: savedUser._id});
    console.log(`   findOneAmdDelete user: ` + foad);
    console.log(`   find again: ` + JSON.stringify(await User.findById(savedUser._id)));


    console.log("\n\nuser.deleteOne()");
    let delRes = await savedUser.deleteOne();
    console.log("   result: " + delRes);


    console.log("\n\nUser.findById()");
    let delBill = await User.findById(savedUser._id);
    console.log("  Deleted Bill: " + delBill);


    console.log("\n\nUser.find()");
    let users2 = await User.find();
    users2.forEach( function (u:IUser) { 
        console.log("  user: " + u.name + "  " + u.email + "   " + u.avatar); 
    });


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
    let count = await User.countDocuments();
    console.log("       count: " + count);

    console.log("\n\n User.deleteMany({age: {$lte: 78}}")
    let delM = await User.deleteMany({age: {$gte: 78}});
    console.log("       deletions: " + delM);

    console.log("\n\n User.count())")
    count = await User.countDocuments();
    console.log("       count: " + count);

    console.log("\n\nUser.find()");
    let users3 = await User.find();
    users3.forEach( function (u:IUser) { 
         console.log("  user: " + u.name + "  " + u.email + "   " + u.age); 
    });
}
