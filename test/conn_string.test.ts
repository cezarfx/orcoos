import { describe, it } from 'mocha';
import chai, { expect, assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);


import { Region } from 'oracle-nosqldb';
import { connect, disconnect } from '../index';

import { AUTH_TYPE_CLOUDSIM, AUTH_TYPE_INSTANCE_PRINCIPAL, AUTH_TYPE_OKE_WORKLOAD, 
    AUTH_TYPE_RESOURCE_PRINCIPAL, AUTH_TYPE_USER_PRINCIPAL, NoSQLConnectionString, 
    PROTOCOL_HTTPS, PROTOCOL_HTTP, SERVICE_CLOUD, SERVICE_ON_PREM 
} from '../lib/nosqldb-adapter/connectionString';


describe("NoSQLConnectionString tests", () => {
    it('parse first', () => {
        let cs = new NoSQLConnectionString('nosqldb+on_prem://user:password@host:123/my_namespace/reserved?o1=v1&o2=v2&o3=&o1=v3');
        expect(cs.getServiceType()).equal(SERVICE_ON_PREM);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('host:123');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('user');
        expect(cs.getPassword()).equal('password');
        expect(cs.getNamespace()).equals('my_namespace');
        expect(cs.getPath()).equals('/my_namespace/reserved');
        expect(cs.getOptions().size).equals(3);
        expect(cs.getOptions().get('o1')).equals('v1');
        expect(cs.getOptions().get('o2')).equals('v2');
        expect(cs.getOptions().get('o3')).equals('');
    });

    it('parse invalid', () => {
        expect(() => {new NoSQLConnectionString(null)})
            .to.throw(Error,'NoSQL DB connection string cannot be empty.');
        expect(() => {new NoSQLConnectionString(undefined)})
            .to.throw(Error,'NoSQL DB connection string cannot be empty.');
        expect(() => {new NoSQLConnectionString('')})
            .to.throw(Error,'NoSQL DB connection string cannot be empty.');
        expect(() => {new NoSQLConnectionString('localhost')})
            .to.throw(Error,'Invalid NoSQL DB connection string, must start with "nosqldb" and contain a host name, got: "localhost"');
        expect(() => {new NoSQLConnectionString('nosql://host')})
            .to.throw(Error,'Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "nosql"');
        expect(() => {new NoSQLConnectionString('http://host')})
            .to.throw(Error,'Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "http"');
    });

    it('parse cloud region', () => {
        let cs = new NoSQLConnectionString('nosqldb://us-ashburn-1');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('us-ashburn-1');
        expect(cs.getRegion()).equal(Region.US_ASHBURN_1);
        expect(cs.getUserName()).equal('');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    // todo: for cloud allow only one region or endpoint
    it('parse cloud multiple regions', () => {
        expect(() => {new NoSQLConnectionString('nosqldb://us-ashburn-1,host:4321,us-sanjose-1')})
            .to.throw(Error,'Invalid NoSQL DB connection string, for cloud service only one region or endpoint is allowed, got: "us-ashburn-1,host:4321,us-sanjose-1"');
    });

    it('parse cloud inst_prn endpoint', () => {
        let cs = new NoSQLConnectionString('nosqldb://+instance_principal@endpoint');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_INSTANCE_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('endpoint');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloud inst_prn local region', () => {
        let cs = new NoSQLConnectionString('nosqldb://+instance_principal@');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_INSTANCE_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloud res_prn region', () => {
        let cs = new NoSQLConnectionString('nosqldb+cloud://+resource_principal@us-ashburn-1');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_RESOURCE_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('us-ashburn-1');
        expect(cs.getRegion()).equal(Region.US_ASHBURN_1);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloud res_prn local region with compartment_id', () => {
        let cs = new NoSQLConnectionString('nosqldb+cloud://+resource_principal@/my_compartment_id');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_RESOURCE_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('my_compartment_id');
        expect(cs.getPath()).equals('/my_compartment_id');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloud oke_wrk endpoint', () => {
        let cs = new NoSQLConnectionString('nosqldb://+OKE_workload@nosql.us-newreg-1.oci.oraclecloud.com');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_OKE_WORKLOAD);
        expect(cs.getHosts()[0]).equal('nosql.us-newreg-1.oci.oraclecloud.com');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloud oke_wrk endpoint no host', () => {
        let cs = new NoSQLConnectionString('nosqldb://+OKE_workload@/');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_OKE_WORKLOAD);
        expect(cs.getHosts()[0]).equal('');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('/');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloudsim1', () => {
        let cs = new NoSQLConnectionString('nosqldb://+cloudsim@localhost');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_CLOUDSIM);
        expect(cs.getHosts()[0]).equal('localhost');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse cloudsim2', () => {
        let cs = new NoSQLConnectionString('nosqldb+cloud://+cloudsim@localhost');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_CLOUDSIM);
        expect(cs.getHosts()[0]).equal('localhost');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal(undefined);
        expect(cs.getPassword()).equal(undefined);
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    // todo: don't allow on_prem with cloudsim
    it('parse cloudsim3', () => {
        let cs = new NoSQLConnectionString('nosqldb+on_prem://+cloudsim@localhost');
        expect(cs.getServiceType()).equal(SERVICE_ON_PREM);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('localhost');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('+cloudsim');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });
    
    it('parse on_prem', () => {
        let cs = new NoSQLConnectionString('nosqldb+on_prem://host');
        expect(cs.getServiceType()).equal(SERVICE_ON_PREM);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('host');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    // todo: test if user can start with + using the hex enc
    it('parse on_prem with + username', () => {
        let cs = new NoSQLConnectionString('nosqldb+on_prem://%43cloudsim@host:8080');
        expect(cs.getServiceType()).equal(SERVICE_ON_PREM);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts()[0]).equal('host:8080');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('%43cloudsim');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse on_prem multiple hosts', () => {
        let cs = new NoSQLConnectionString('nosqldb+on_prem://host1,host2:8000,host3:8080');
        expect(cs.getServiceType()).equal(SERVICE_ON_PREM);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts().length).equal(3);
        expect(cs.getHosts()[0]).equal('host1');
        expect(cs.getHosts()[1]).equal('host2:8000');
        expect(cs.getHosts()[2]).equal('host3:8080');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('');
        expect(cs.getPath()).equals('');
        expect(cs.getOptions().size).equals(0);
    });

    it('parse on_prem http namespace', () => {
        let cs = new NoSQLConnectionString('nosqldb+on_prem+http://host:8080/ns1');
        expect(cs.getServiceType()).equal(SERVICE_ON_PREM);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTP);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts().length).equal(1);
        expect(cs.getHosts()[0]).equal('host:8080');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('ns1');
        expect(cs.getPath()).equal('/ns1');
        expect(cs.getOptions().size).equals(0);
    });


    it('parse options', () => {
        let cs = new NoSQLConnectionString('nosqldb://host/ns1?op1=v1&op2=v2&op3=v3');
        expect(cs.getServiceType()).equal(SERVICE_CLOUD);
        expect(cs.getProtocol()).equal(PROTOCOL_HTTPS);
        expect(cs.getAuthType()).equal(AUTH_TYPE_USER_PRINCIPAL);
        expect(cs.getHosts().length).equal(1);
        expect(cs.getHosts()[0]).equal('host');
        expect(cs.getRegion()).equal(undefined);
        expect(cs.getUserName()).equal('');
        expect(cs.getPassword()).equal('');
        expect(cs.getCompartment()).equals('ns1');
        expect(cs.getPath()).equal('/ns1');
        expect(cs.getOptions().size).equals(3);
        expect(cs.getOptions().get('op1')).equals('v1');
        expect(cs.getOptions().get('op2')).equals('v2');
        expect(cs.getOptions().get('op3')).equals('v3');
    });

    it('good list', () => {

        let connStrs = ['nosqldb://us-ashburn-1',
            'nosqldb://us-ashburn-1/',
            'nosqldb://+instance_principal@us-ashburn-1/compartment_ocid',
            'nosqldb://+resource_principal@us-ashburn-1/compartment_ocid',
            'nosqldb://+oke_workload@us-ashburn-1/compartment_ocid',
            'nosqldb://localhost:8080/comp',
            'nosqldb://user@host',
            'nosqldb://user:password@host',
            'nosqldb://user:password@host:123/dir?o1=v1&o2=v2&o1=v3',
            'nosqldb://h',
            'nosqldb://+cloudsim@host',
            'nosqldb+cloud+https://+cloudsim@host',
            'nosqldb+cloud://+resource_principal@us-ashburn-1',
            'nosqldb+cloud://+resource_principal@',
            'nosqldb+cloud://+instance_principal@',
            'nosqldb+cloud://+oke_workload@',
            'nosqldb+cloud://+resource_principal@/compartment_ocid',
            'nosqldb+cloud://+instance_principal@/compartment_ocid',
            'nosqldb+cloud://+oke_workload@/compartment_ocid',
            'nosqldb+on_prem://host',
            'nosqldb+on_prem+https://host',
            'nosqldb+on_prem://h1:81,h2:82,h3,h4:2001/?o1=v1',
            'nosqldb://+instance_principal@host',
            'nosqldb://+OKE_workload@nosql.us-newreg-1.oci.oraclecloud.com',
            'nosqldb+on_prem://user:pas@host/',
            'nosqldb+on_prem+ftp://+cloudsim@host/',
            'nosqldb+smtp://+cloudsim@host/',
            'nosqldb+cloud+sftp://+cloudsim@host/',
            'nosqldb+webdav://+cloudsim@host/',
        ];
        
        for (let connStr of connStrs) {
            let cs = new NoSQLConnectionString(connStr);
            expect(cs.getServiceType()).oneOf([SERVICE_CLOUD, SERVICE_ON_PREM]);
            expect(cs.getProtocol()).oneOf([PROTOCOL_HTTPS, PROTOCOL_HTTP, 'ftp', 'smtp', 'sftp', 'webdav']);
            expect(cs.getAuthType()).oneOf([AUTH_TYPE_USER_PRINCIPAL, AUTH_TYPE_INSTANCE_PRINCIPAL, 
                AUTH_TYPE_RESOURCE_PRINCIPAL, AUTH_TYPE_OKE_WORKLOAD, AUTH_TYPE_CLOUDSIM]);
        }
    });
    
    it('bad list', () => {
        let badConnStrs = [
            '',
            'nosql',
            'localhost',
            'http://localhost',
            'nosqldb.on_prem://.cloudsim@host/',
            'nosqldb$on_prem://$cloudsim@host/',
            'nosqldb-on_prem://-cloudsim@host/',
            'nosqldb@on_prem://cloudsim@host/',
            'nosqldb&on_prem://&cloudsim@host/',
            'nosqldb://',
            'nosqldb:///dir',
        ];

        for (let connStr of badConnStrs) {
            // console.log('Bad connection string:'+ connStr);
            try {
                let cs = new NoSQLConnectionString(connStr);
                assert.fail('Bad connection string should throw exception: ' + connStr);
            } catch (err) {
                // console.log('Actual error: ' + err);
                expect(String(err)).oneOf([
                    'Error: NoSQL DB connection string cannot be empty.',
                    'Error: Invalid NoSQL DB connection string, must start with "nosqldb" and contain a host name, got: "nosql"',
                    'Error: Invalid NoSQL DB connection string, must start with "nosqldb" and contain a host name, got: "localhost"',
                    'Error: Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "http"',
                    'Error: Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "nosqldb.on_prem"',
                    'Error: Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "nosqldb$on_prem"',
                    'Error: Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "nosqldb-on_prem"',
                    'Error: Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "nosqldb@on_prem"',
                    'Error: Invalid scheme, NoSQL DB connection string must start with "nosqldb", got: "nosqldb&on_prem"',
                    'Error: Invalid NoSQL DB connection string, must contain a host name, got: ""',
                ]);
            }
        }
    });

    it('connect to nosqldb+on_prem+http://localhost:8080', async() => {
         let r = await connect('nosqldb+on_prem+http://localhost:8080');
         expect(r).not.empty;
         await disconnect();
    }).timeout(3000);
});