/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */


/*!
 * Module exports.
 */

'use strict';

exports.Array = require('./array');
exports.Buffer = require('./buffer');

exports.Document = // @deprecate
exports.Embedded = require('./ArraySubdocument');

exports.DocumentArray = require('./DocumentArray');
exports.Decimal128 = require('./decimal128');
exports.ObjectId = require('./objectid');

exports.Map = require('./map');

exports.Subdocument = require('./subdocument');
