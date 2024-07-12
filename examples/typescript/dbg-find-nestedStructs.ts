//const ondbmongoose = require('mongoose');
//const ondbmongoose = require('ondbmongoose');
import ondbmongoose from 'ondbmongoose';

// mongoose.set('strictQuery', false);
ondbmongoose.set('strictQuery', false);

//import { Schema, model, connect } from 'mongoose';
import { Schema, model, connect } from 'ondbmongoose';

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
    await connect('http://localhost:8080');
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
    users.forEach( function (u:IUser) { 
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
    let nyBills = (await User.find({'hq.city': "NY"})/*.where('age', age)*/);
    nyBills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + "  hq.city: " + u.hq.city));

    console.log(`\n\nUser.find({'hq.codes': 77})`);
    let hqcodesBills = (await User.find({'hq.codes': 77}));
    hqcodesBills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + "  hq.codes: " + JSON.stringify(u.hq.codes)));

    console.log(`\n\nUser.find({'offices.city': "London"})`);
    let londonBills = (await User.find({'offices.city': "London"}));
    londonBills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + "  offices[0].city: " + u.offices[0].city));

    console.log(`\n\nUser.find({'offices.codes': 77})`);
    let ioBills = await User.find({'offices.codes': 77});
    ioBills.forEach((u:IUser) => console.log("  user: " + u.name + "  " + "  offices[1].codes: " + JSON.stringify(u.offices[1].codes)));
}