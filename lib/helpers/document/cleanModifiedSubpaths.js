/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/*!
 * ignore
 */

module.exports = function cleanModifiedSubpaths(doc, path, options) {
  options = options || {};
  const skipDocArrays = options.skipDocArrays;

  let deleted = 0;
  if (!doc) {
    return deleted;
  }

  for (const modifiedPath of Object.keys(doc.$__.activePaths.getStatePaths('modify'))) {
    if (skipDocArrays) {
      const schemaType = doc.$__schema.path(modifiedPath);
      if (schemaType && schemaType.$isMongooseDocumentArray) {
        continue;
      }
    }
    if (modifiedPath.startsWith(path + '.')) {
      doc.$__.activePaths.clearPath(modifiedPath);
      ++deleted;

      if (doc.$isSubdocument) {
        const owner = doc.ownerDocument();
        const fullPath = doc.$__fullPath(modifiedPath);
        owner.$__.activePaths.clearPath(fullPath);
      }
    }
  }
  return deleted;
};
