/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 */

import { CapacityMode } from 'oracle-nosqldb';
import { Schema, model } from '../index';

// 1. Create an interface representing a DB entity.
export interface ISale {
    //_id?: any;     // automaticaly handled
    saleDate: Date;
    items?: [IItem];
    storeLocation: string;
    customer?: ICustomer;
    couponUsed?: boolean;
    purchaseMethod?: PurchaseMethod;
};

interface IItem {
    name: string;
    price: number;
    quantity: number;
    tags: string[];
};

interface ICustomer {
    gender?: Gender;
    age?: number;
    email?: string;
    satisfaction?: number;
};

export enum Gender {
    M = 'M', 
    F = 'F'
};

export enum PurchaseMethod {
    InStore = "InStore", 
    Online = "Online"
};


export const itemSchema = new Schema<IItem>({
    name: String,
    price: Number,
    quantity: Number,
    tags: [String]
}, 
    // schema options
    { 
        _id: false,             // do not generate _id in the item objects
        autoCreate: false,      // do not create a table for items
        collection: 'o_items'   // when creating a table, name it o_items
    });

export const customerSchema = new Schema<ICustomer>({
    gender: { type: String, enum: Gender, optional: true },
    age: { type: Number, optional: true },
    email: { type: String, optional: true },
    satisfaction: { type: Number, optional: true }
}, 
    {
        _id: false,
        autoCreate: false, 
        collection: 'o_cust'
    });

export const saleSchema = new Schema<ISale>({
    saleDate: { type: Date, required: true },
    items: [{
        _id: false,
        name: String,
        price: Number,
        quantity: Number,
        tags: [String]
    }],
    storeLocation: { type: String, required: true },
    customer: {
        type: customerSchema,
        optional: true
    },
    couponUsed: { type: Boolean, optional: true }, 
    purchaseMethod: { 
        type: String, 
        enum: PurchaseMethod, 
        default: PurchaseMethod.InStore, 
        optional: true 
    },
}, 
    {
        collection: 'o_sales',   // use the table with this name
        collectionOptions: {
            tableLimits: {
                mode: CapacityMode.PROVISIONED, 
                readUnits: 50,
                writeUnits: 50,
                storageGB: 1
            } 
        }
    });

export const Sale = model<ISale>('Sale', saleSchema);
export const Item = model<IItem>('Item', itemSchema);
export const Customer = model<ICustomer>('Customer', customerSchema);

export let names = ["Al", "Bo", "Yo", "Jo", "Ax"];
export let cities = ["LA", "NY", "SF", "London", "Paris"];
export let itemNames = ["wine", "milk", "beer", "soda", "tea"];
export let tags = ["white", "green", "red"];

export async function populateDatabase(): Promise<ISale[]> {
    let r: number;   
    let allSales: Array<ISale> = [];

    for( let name of names) {
        r = Math.round(1000 * Math.random());

        let city = cities[r % cities.length];
        const sale: ISale = new Sale<ISale>({
            saleDate: new Date(),
            items: [new Item({
                name: itemNames[r % itemNames.length],
                price: r/10,
                quantity: r % 10 + (city.length > 2 ? 10 : 0),
                tags: tags.slice(0, r % tags.length)
            })],
            storeLocation: city,
            customer: {
                gender: Object.values(Gender)[r % Object.keys(Gender).length],
                age: r % 100,
                email: name + '@e.mail'
            },
            couponUsed: r % 2 == 0,
            purchaseMethod: Object.values(PurchaseMethod)[r % Object.keys(PurchaseMethod).length]
        });
        allSales.push(sale);
    };

    await Sale.insertMany(allSales, {rawResult: true});
    return allSales;
}