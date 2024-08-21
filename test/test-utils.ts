import { CapacityMode } from "oracle-nosqldb";

declare let  process : {
    env: {
        ONDB_URL: string
    }
};

export let ONDB_URL = process?.env?.ONDB_URL || 'nosqldb+on_prem+http://127.0.0.1:8080/';

export let TEST_TABLE_OPTIONS = {
    collectionOptions: {
        tableLimits: {
            mode: CapacityMode.PROVISIONED, 
            readUnits: 50,
            writeUnits: 50,
            storageGB: 1
        } 
    }
};
