/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 */

import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { connect } from '../index';

import { Schema, model } from '../index';
import { ONDB_URL, TEST_TABLE_OPTIONS } from './test-utils';
import { CapacityMode } from 'oracle-nosqldb';

// 1. Create an interface representing a DB entity.
interface IPlayer {
    _id: IPlayerKey;
    name: String;
    goals: number;
};

interface IPlayerKey {
    team: string;
    squadNumber: number;
};

export const playerSchema = new Schema<IPlayer>({
    _id: {                                  // composite key with 2 components, of which one is a shard key (see below under collectionOptions/shardKey)
        team: String, 
        squadNumber: Number
    },
    name: String,
    goals: Number,
}, 
{
    collection: 'o_players',                // Name of the table used for collection
    collectionOptions: {
        shardKey: ["team"],                 // Shard key component
        //  compartment: 'ondbMongooseSDK',     // Cloud only, compartment id or name to use if table is created
        definedTags: {                      // Defined tags represent metadata managed by an administrator. 
            customTag: 'ondb', 
            'sdk': 'ondbMongooseSDK'
        },
        freeFormTags: {                     // Free-form tags represent an unmanaged metadata created and applied by the user. 
            "Department": "Finance"
        },  
        // namespace: 'ondbMongooseSDK',       // On-premises only, namespace used if table is created 
        tableLimits: {                      // Cloud only, table limits.
            mode: CapacityMode.PROVISIONED, // Capacity mode of the table, "ON_DEMAND" or "PROVISIONED"
            readUnits: 50,                  // desired throughput of read operations in terms of read units, if table is created
            writeUnits: 50,                 // desired throughput of write operations in terms of write units, if table is created
            storageGB: 1                    // The maximum storage to be consumed by the table, in gigabytes, if table is created
        },
        timeout: 5000,                      // Timeout for the row operations in milliseconds.
        ddlTimeout: 20000,                  // Timeout for the table operations in milliseconds.
        durability: undefined,              // Durability for master/replica sync/acks write operations
        consistency: undefined,             // Consistency guarantees for read operations, EVENTUAL or ABSOLUTE
    }
});

export const Player = model<IPlayer>('Player', playerSchema);

export let names = ["Al", "Bo", "Yo", "Jo", "Ax"];
export let teams = ["LA", "NY", "SF", "London", "Paris"];

export async function populateCollection(): Promise<IPlayer[]> {
    let n: number = 0;   
    let allPlayers: Array<IPlayer> = [];

    for( let team of teams) {
        let teamNumbers: Array<Number> = [];
        for (let i = 0; i < 5; i++) {
            for (let tryNo = 0 ; tryNo < 100; tryNo++) {
                n = Math.round(50 * Math.random());
                if ( !teamNumbers.includes(n)) {
                    teamNumbers.push(n);
                    break;
                }
            }

            let name = names[n % names.length];
            const player: IPlayer = await new Player<IPlayer>({
                _id: {team: team, squadNumber: n},
                name: name,
                goals: Math.round(50 * Math.random())
            });
            allPlayers.push(player);
        }
    };

    await Player.insertMany(allPlayers, {rawResult: true});
    return allPlayers;
}

describe("Composite Keys", () => {
    let allPlayers: Array<IPlayer> = [];

    it('connect', async() => {
        expect(await connect(ONDB_URL, { logLevel: 2 }));
    });
    
    it('delete all', async() => {
        expect(await Player.deleteMany());
        expect(await Player.count()).equal(0);
    }).timeout(10000);

    it('populate players', async() => {
        allPlayers = await populateCollection();
        expect(allPlayers.length).equal(25);
        expect(await Player.count()).equal(25);
    }).timeout(10000);

    it('query players', async() => {
        let dbPlayers = await Player.find();
        expect(dbPlayers).to.be.an('array');
        expect(dbPlayers.length).equal(allPlayers.length);
        for (let player of dbPlayers) {
            expect(player.name).to.be.oneOf(names);
            expect(player.goals).to.be.oneOf(allPlayers.map(p => p.goals));
        }
    });

    it('updateOne with pk', async() => {
        let firstPlayer = await Player.findById(allPlayers[0]._id);
        expect(firstPlayer._id.team = allPlayers[0]._id.team);
        expect(firstPlayer._id.squadNumber = allPlayers[0]._id.squadNumber);
        
        expect(await firstPlayer.updateOne({$set: {name: "Messi"}}));
        let messi = await Player.findById(allPlayers[0]._id);
        expect(messi.name).equal("Messi");
    });

    it('updateMany fail', async () => {
        await expect(Player.updateMany({$inc: {'goals': 1}}))
            .to.be.eventually.rejectedWith("updateMany() filter param doesn't contain _id field.");
    });

    let deletedPlayer;

    it('deleteOne with pk', async() => {
        expect(await Player.deleteOne({_id: {team: allPlayers[0]._id.team, squadNumber: allPlayers[0]._id.squadNumber}}));
        deletedPlayer = allPlayers.shift();
        expect(await Player.count()).equal(allPlayers.length);
        expect(await Player.findById(deletedPlayer?._id)).to.be.null;
    });

    it('deleteMany with partial pk', async() => {
        expect(await Player.deleteMany({_id: {team: deletedPlayer._id.team}}));
        allPlayers.splice(0, 4);
        expect(await Player.count()).equal(allPlayers.length);
    });

    it('key non-key field name colision', async() => {
        interface ICollisionPlayer {
            _id: ICollisionPlayerKey;
            name: String;
            goals: number;
            team: String;
        };
        
        interface ICollisionPlayerKey {
            team: string;
            squadNumber: number;
        };
        
        const cPlayerSchema = new Schema<ICollisionPlayer>({
            _id: {
                team: String, 
                squadNumber: Number
            },
            name: String,
            goals: Number,
            team: String,
        }, {collection: 'o_collPlayers'});
        
        try {
            const CPlayer = model<ICollisionPlayer>('CollisionPlayer', cPlayerSchema);

            await CPlayer.deleteMany();
        } catch (e: any) {
            expect(e.message).contains('Composite key and non-key field name collision: "team"');
        }
    });

    it('key field of type Date', async() => {
        interface IDatePlayer {
            _id: IDatePlayerKey;
            name: String;
            goals: number;
        };
        
        interface IDatePlayerKey {
            team: string;
            joinDate: Date;
        };
        
        const dPlayerSchema = new Schema<IDatePlayer>({
            _id: {
                team: String, 
                joinDate: Date
            },
            name: String,
            goals: Number
        }, 
        {
            collection: 'o_datePlayers',
            ...TEST_TABLE_OPTIONS,
        });
        
        const DPlayer = model<IDatePlayer>('DatePlayer', dPlayerSchema);

        expect(await DPlayer.deleteMany());
        expect(await DPlayer.count()).equal(0);
    });
});