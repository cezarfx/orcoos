/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

/*!
 * Centralize this so we can more easily work around issues with people
 * stubbing out `process.nextTick()` in tests using sinon:
 * https://github.com/sinonjs/lolex#automatically-incrementing-mocked-time
 * See gh-6074
 */

'use strict';

const nextTick = typeof process !== 'undefined' && typeof process.nextTick === 'function' ?
  process.nextTick.bind(process) :
  cb => setTimeout(cb, 0); // Fallback for browser build

module.exports = function immediate(cb) {
  return nextTick(cb);
};
