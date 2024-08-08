/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * For consistency's sake, we replace positional operator `$` and array filters
 * `$[]` and `$[foo]` with `0` when looking up schema paths.
 */

module.exports = function cleanPositionalOperators(path) {
  return path.
    replace(/\.\$(\[[^\]]*\])?(?=\.)/g, '.0').
    replace(/\.\$(\[[^\]]*\])?$/g, '.0');
};
