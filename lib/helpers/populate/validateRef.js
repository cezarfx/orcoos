/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const MongooseError = require('../../error/mongooseError');
const util = require('util');

module.exports = validateRef;

function validateRef(ref, path) {
  if (typeof ref === 'string') {
    return;
  }

  if (typeof ref === 'function') {
    return;
  }

  throw new MongooseError('Invalid ref at path "' + path + '". Got ' +
    util.inspect(ref, { depth: 0 }));
}
