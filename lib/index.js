'use strict';

/*!
 * Module dependencies.
 */

const ondbDriver = require('./drivers/node-ondb-native');

require('./driver').set(ondbDriver);

// const ondbDriver = require('./drivers/node-ondbdb-native');

// require('./driver').set(ondbDriver);


const mongoose = require('./mongoose');

mongoose.setDriver(ondbDriver);

//mongoose.Mongoose.prototype.mongo = require('mongodb');
mongoose.Mongoose.prototype.mongo = require('./nosqldb-adapter/client');

module.exports = mongoose;
