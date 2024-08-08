/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

exports.arrayAtomicsBackupSymbol = Symbol('mongoose#Array#atomicsBackup');
exports.arrayAtomicsSymbol = Symbol('mongoose#Array#_atomics');
exports.arrayParentSymbol = Symbol('mongoose#Array#_parent');
exports.arrayPathSymbol = Symbol('mongoose#Array#_path');
exports.arraySchemaSymbol = Symbol('mongoose#Array#_schema');
exports.documentArrayParent = Symbol('mongoose:documentArrayParent');
exports.documentIsSelected = Symbol('mongoose#Document#isSelected');
exports.documentIsModified = Symbol('mongoose#Document#isModified');
exports.documentModifiedPaths = Symbol('mongoose#Document#modifiedPaths');
exports.documentSchemaSymbol = Symbol('mongoose#Document#schema');
exports.getSymbol = Symbol('mongoose#Document#get');
exports.modelSymbol = Symbol('mongoose#Model');
exports.objectIdSymbol = Symbol('mongoose#ObjectId');
exports.populateModelSymbol = Symbol('mongoose.PopulateOptions#Model');
exports.schemaTypeSymbol = Symbol('mongoose#schemaType');
exports.sessionNewDocuments = Symbol('mongoose:ClientSession#newDocuments');
exports.scopeSymbol = Symbol('mongoose#Document#scope');
exports.validatorErrorSymbol = Symbol('mongoose:validatorError');
