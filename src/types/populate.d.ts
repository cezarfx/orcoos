/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 * 
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

declare module 'ondbmongoose' {

  /**
   * Reference another Model
   */
  type PopulatedDoc<
    PopulatedType,
    RawId extends RefType = (PopulatedType extends { _id?: RefType; } ? NonNullable<PopulatedType['_id']> : Types.ObjectId) | undefined
  > = PopulatedType | RawId;

  interface PopulateOptions {
    /** space delimited path(s) to populate */
    path: string;
    /** fields to select */
    select?: any;
    /** query conditions to match */
    match?: any;
    /** optional model to use for population */
    model?: string | Model<any>;
    /** optional query options like sort, limit, etc */
    options?: QueryOptions;
    /** correct limit on populated array */
    perDocumentLimit?: number;
    /** optional boolean, set to `false` to allow populating paths that aren't in the schema */
    strictPopulate?: boolean;
    /** deep populate */
    populate?: string | PopulateOptions | (string | PopulateOptions)[];
    /**
     * If true Mongoose will always set `path` to a document, or `null` if no document was found.
     * If false Mongoose will always set `path` to an array, which will be empty if no documents are found.
     * Inferred from schema by default.
     */
    justOne?: boolean;
    /** transform function to call on every populated doc */
    transform?: (doc: any, id: any) => any;
    /** Overwrite the schema-level local field to populate on if this is a populated virtual. */
    localField?: string;
    /** Overwrite the schema-level foreign field to populate on if this is a populated virtual. */
    foreignField?: string;
  }

  interface PopulateOption {
    populate?: string | string[] | PopulateOptions | PopulateOptions[];
  }
}
