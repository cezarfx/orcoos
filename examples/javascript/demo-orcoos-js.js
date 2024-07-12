//const ondbmongoose = require('mongoose');
//import { Schema, model, connect } from 'mongoose';
import ondbmongoose, { Schema, model, connect } from 'ondbmongoose';

// mongoose.set('strictQuery', false);
ondbmongoose.set('strictQuery', false);

 
// 2. Create a Schema corresponding to the document interface.
const addressSchema = new Schema({
    city: String,
    street: String,
    codes: [Number],
}, {autoCreate: false});

const userSchema = new Schema({
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
const User = model('User', userSchema);
const Address = model('Address', addressSchema);


run().catch(err => console.log(err));

async function run() {
    // 4. Connect to NoSQL DB1
    console.log("Connecting to DB ...");
    //await connect('mongodb://localhost');
    await connect('nosqldb+on_prem+http://localhost:8080');
    console.log("    ... done.");

    let now = Date.now();

    console.log("\nuser = new User...");
    let r = Math.round(1000 * Math.random());
    let age = r % 100;
    
    const user = new User({
      name: 'Bill_' + r,
      email: 'bill@initech.com_' + r,
      avatar: 'https://tech.com/bill.png_' + r,
      age: age,
      dateAdded: now,
      dept: "eng",
      hq: new Address({city: "NY", codes: [age]}),
      offices: [
        new Address({city: "London"}),
        new Address({city: "Io", codes: [1,2, age]})
      ]
    });
    console.log("user.save()");
    let savedUser = await user.save();

    console.log("  savedUser._id: " + savedUser._id);


    console.log("\n\nUser.findById()");
    let bill = await User.findById(savedUser._id);
    console.log("  Bill: " + bill);


    console.log("\n\nUser.find()");
    let users = await User.find();
    users.forEach( function (u) { 
        console.log("  user: " + u.name + "  " + u.age + "   " + u.dept + " " + JSON.stringify(u.dateAdded)); 
    });
}
