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
  import mongodb = require('mongodb');

  /*
   * section collection.js
   */
  interface CollectionBase<T extends mongodb.Document> extends mongodb.Collection<T> {
    /*
     * Abstract methods. Some of these are already defined on the
     * mongodb.Collection interface so they've been commented out.
     */
    ensureIndex(...args: any[]): any;
    findAndModify(...args: any[]): any;
    getIndexes(...args: any[]): any;

    /** The collection name */
    collectionName: string;
    /** The Connection instance */
    conn: Connection;
    /** The collection name */
    name: string;
  }

  /*
   * section drivers/node-mongodb-native/collection.js
   */
  interface Collection<T extends mongodb.Document = mongodb.Document> extends CollectionBase<T> {
    /**
     * Collection constructor
     * @param name name of the collection
     * @param conn A MongooseConnection instance
     * @param opts optional collection options
     */
    // eslint-disable-next-line @typescript-eslint/no-misused-new
    new(name: string, conn: Connection, opts?: any): Collection<T>;
    /** Formatter for debug print args */
    $format(arg: any, color?: boolean, shell?: boolean): string;
    /** Debug print helper */
    $print(name: string, i: string | number, args: any[], color?: boolean, shell?: boolean): void;
    /** Retrieves information about this collections indexes. */
    getIndexes(): ReturnType<mongodb.Collection<T>['indexInformation']>;
  }
  let Collection: Collection;
}
