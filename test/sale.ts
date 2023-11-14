import { Schema, model } from '../index';

// 1. Create an interface representing a DB entity.
export interface ISale {
    //_id?: any;
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


const itemSchema = new Schema<IItem>({
    name: String,
    price: Number,
    quantity: Number 
});

const customerSchema = new Schema<ICustomer>({
    gender: { type: String, enum: Gender, optional: true },
    age: { type: Number, optional: true },
    email: { type: String, optional: true },
    satisfaction: { type: Number, optional: true }
});

const saleSchema = new Schema<ISale>({
    saleDate: { type: String, required: true },
    items: [{
        name: String,
        price: Number,
        quantity: Number
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
    }
});

export const Sale = model<ISale>('Sale', saleSchema);
export const Item = model<IItem>('Item', itemSchema);
export const Customer = model<ICustomer>('Customer', customerSchema);