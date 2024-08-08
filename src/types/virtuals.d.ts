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
    type VirtualPathFunctions<DocType = {}, PathValueType = unknown, TInstanceMethods = {}> = {
      get?: TVirtualPathFN<DocType, PathValueType, TInstanceMethods, PathValueType>;
      set?: TVirtualPathFN<DocType, PathValueType, TInstanceMethods, void>;
      options?: VirtualTypeOptions<HydratedDocument<DocType, TInstanceMethods>, DocType>;
    };

  type TVirtualPathFN<DocType = {}, PathType = unknown, TInstanceMethods = {}, TReturn = unknown> =
    <T = HydratedDocument<DocType, TInstanceMethods>>(this: Document<any, any, DocType> & DocType, value: PathType, virtual: VirtualType<T>, doc: Document<any, any, DocType> & DocType) => TReturn;

    type SchemaOptionsVirtualsPropertyType<DocType = any, VirtualPaths = Record<any, unknown>, TInstanceMethods = {}> = {
      [K in keyof VirtualPaths]: VirtualPathFunctions<IsItRecordAndNotAny<DocType> extends true ? DocType : any, VirtualPaths[K], TInstanceMethods>
    };
}
