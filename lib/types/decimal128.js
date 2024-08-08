/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

/**
 * Decimal128 type constructor
 *
 * #### Example:
 *
 *     const id = new mongoose.Types.Decimal128('3.1415');
 *
 * @constructor Decimal128
 */

'use strict';

module.exports = require('bson').Decimal128;
