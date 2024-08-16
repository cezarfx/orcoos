/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 */

/**
 *  Example shows how the Ondb Mongoose SDK is used instead of Mongoose.
 * 
 *  The following two lines should be updated and the rest of the code is unchenged. 
 */

// import mongoose, { Schema, model, connect } from 'mongoose';
// mongoose.set('strictQuery', false);

import ondbmongoose, { Schema, model, connect } from 'ondbmongoose';
ondbmongoose.set('strictQuery', false);

 
// Create a Schema corresponding to the document interface.
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

// Create a Model.
const User = model('User', userSchema);
const Address = model('Address', addressSchema);


run().catch(err => console.log(err));

async function run() {
    // Connect to NoSQL DB
    console.log("Connecting to DB ...");
    
    await connect('nosqldb+on_prem+http://localhost:8080', {logLevel: 3});
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
    // Save user
    let savedUser = await user.save();

    console.log("  savedUser._id: " + savedUser._id);


    console.log("\n\nUser.findById()");
    // Find user by id
    let bill = await User.findById(savedUser._id);
    console.log("  Bill: " + bill);


    console.log("\n\nUser.find()");
    // Find all users
    let users = await User.find();
    users.forEach( function (u) { 
        console.log("  user: " + u.name + "  " + u.age + "   " + u.dept + " " + JSON.stringify(u.dateAdded)); 
    });
}
