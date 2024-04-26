const oracleNoSqlDb = require("oracle-nosqldb");

const HOSTS_REGEX =
    /^(?<scheme>[^/]+):\/\/(?:(?<username>[^:@]*)(?::(?<password>[^@]*))?@)?(?<hosts>(?!:)[^/?@]*)(?<rest>.*)/;

const NOSQLDB = 'nosqldb';
const SERVICE_CLOUD = 'cloud';
const SERVICE_ON_PREM = 'on_prem';

const PROTOCOL_HTTP = 'http';
const PROTOCOL_HTTPS = 'https';

const AUTH_TYPE_USER_PRINCIPAL = 'user_principal';
const AUTH_TYPE_INSTANCE_PRINCIPAL = 'instance_principal';
const AUTH_TYPE_RESOURCE_PRINCIPAL ='resource_principal';
const AUTH_TYPE_OKE_WORKLOAD = 'oke_workload';
const AUTH_TYPE_CLOUDSIM = 'cloudsim';

const OPTION_CONFIG_FILE = 'configFile';
const OPTION_PROFILE = 'profile';
const OPTION_TENANCY = 'tenancy';
const OPTION_USER = 'user';
const OPTION_FINGERPRINT = 'fingerprint';
const OPTION_KEY_FILE = 'key_file';
const OPTION_PASS_PHRASE = 'pass_phrase';
const OPTION_PEM_CERTIFICATE_FILE = 'pemCertificateFile';
// const OPTION_PEM_CERTIFICATE_PASSWORD = 'pemCertificatePassword';   // Not impl in Node SDK
const OPTION_ADMIN_POLL_DELAY = 'adminPollDelay';
const OPTION_ADMIN_POLL_TIMEOUT = 'adminPollTimeout';
const OPTION_CONSISTENCY = 'consistency';
const OPTION_DDL_TIMEOUT = 'ddlTimeout';
const OPTION_DURABILITY_MASTER_SYNC = 'durabilityMasterSync';
const OPTION_DURABILITY_REPLICA_ACK = 'durabilityReplicaAck';
const OPTION_DURABILITY_REPLICA_SYNC = 'durabilityReplicaSync';
const OPTION_HTTP_OPT = 'httpOpt';
const OPTION_LONG_AS_BIG_INT = 'longAsBigInt';
const OPTION_MAX_MEMORY_MB ='maxMemoryMB';
const OPTION_NUMBER_LIB = 'numberLib';
const OPTION_RATE_LIMITER = 'rateLimiter';
const OPTION_RATE_LIMITER_PERCENT = 'rateLimiterPercent';
const OPTION_RETRY_BASE_DELAY ='retryBaseDelay';
const OPTION_RETRY_CONTROL_OP_BASE_DELAY ='retryControlOpBaseDelay';
const OPTION_RETRY_MAX_RETRIES ='retryMaxRetries';
const OPTION_RETRY_SEC_INFO_BASE_DELAY ='retrySecInfoBaseDelay';
const OPTION_RETRY_SEC_INFO_NUM_BACKOFF ='retrySecInfoNumBackoff';
const OPTION_RETRY_SECURITY_INFO_TIMEOUT ='retrySecurityInfoTimeout';
const OPTION_TABLE_POLL_DELAY = 'tablePollDelay';
const OPTION_TABLE_POLL_TIMEOUT = 'tablePollTimeout';
const OPTION_TIMEOUT = 'timeout';

/**
 * This file implements the NoSQL DB connection string spec.
 * 
 * NoSQL DB Connection string
 * 
 * Format:  nosqldb[+service_type][+protocol]://[auth@]host1:port1[,....hostN[:portN]][/compartment_or_namespace/reserved[?[paramspec]]]
 * 
 * - nosqldb[+service_type][+protocol] - the scheme. New schemes should be registered with the Internet Assigned Numbers Authority (IANA), although non-registered schemes are used in practice, like mongodb or dse. 
 *      - nosqldb - required, error if not present
 *      - service_type - on_prem|cloud - optional, cloud is default if not specified
 *      - protocol - http|https - optional, https is default if not specified.
 * - auth:  - authentication type, optional - user auth by default if not specified
 *      - username[:password] - user name and optional password, strongly advised not to be used in production but it is included here for simplicity at develop time
 *      - +instance_principal | +resource_principal | +oke_workload - valid only if service_type is cloud, valid without a hostname impling the local instance/resource/OKE workload instance
 *      - +cloudsim - using this option will ignore cloud auth options, ex: configFile,tenancy,user, etc.
 * - host1[:port1][, ...hostN[:portN]] - at least one hostname is required, depending on the service type (see below) these values have the following semantics:
 *     - host - if service_type is cloud host will be checked as a known region identifier. Example: us-ashburn-1
 *            - if it is not found as a region identifier it is interpreted as a direct endpoint
 *            - if service_type is cloud only one region/endpoint is allowed
 * - compartment_or_namespace 
 *     - for cloud the compartment name or oci compartment_id. OCI compartment_id is required when using instance, resource principal or OKE workload instance auth.
 *     - for on_prem the defualt namespace name.
 * - reserved - optional reserved for future extensions (ex: /table_name/pk)
 * - paramspec - optional list of options: option_name1[=option_value1][,...option_nameN=option_nameN], ignored if not known
 *     - for cloud:
 *         - configFile?[=~/.oci/config] - specifies the location of the config file, if value not specified the default ~/.oci/config location is used
 *         - profile?=profile_name - specifies the profile name to be used from config file, if not specified DEFAULT profile is used.
 *         - all entries allowed in config file other then region:(if config option is specified the following are ignored)
 *             - tenancy=tenancy_id - specifies the OCID of your tenancy.
 *             - user=user_id - specifies the OCID of the user calling the API. 
 *             - fingerprint=fingerprint_value - specifies the fingerprint for the public key that was added to this user.
 *             - key_file=full_path - specifies the full path and filename of the private key.
 *             - pass_phrase=passphrase - specifies the passphrase used for the key, if it is encrypted.
 *             - security_token_file?=file_name - If session token authentication is being used, then this parameter is required.
 *     - for cloudsim:
 *             - ideally all cloud options would work and be ignored if not applicable
 *     - for on_prem:
 *         - pemCertificateFile?=fileName
 *         - pemCertificatePassword?=passphrase
 *     - for all service types (all of these are defined here): 
 *         - adminPollDelay?=number 
 *         - adminPollTimeout?=number
 *         - consistency?=EVENTUAL(default) | ABSOLUTE
 *         - numberLib?=string - for NodeJS SDK only - number library to use
 *         - ddlTimeout?=number
 *         - durabilityMasterSync?=string - if not set: durability on server is used, else: NO_SYNC | SYNC | WRITE_NO_SYNC
 *         - durabilityReplicaAck?=string - if not set: durability on server is used, else: ALL | NONE | SIMPLE_MAJORITY
 *         - durabilityReplicaSync?=string - if not set: durability on server is used, else: NO_SYNC | SYNC | WRITE_NO_SYNC
 *         - httpOpt?  - Http/Https options
 *         - longAsBigInt?=boolean - for NodeJS SDK only
 *         - maxMemoryMB?=number 
 *         - protocol?=string - specify the protocol to use, if not specified http is used for on_prem and cloudsim and https for the rest. Only http and https are valid for now.
 *         - rateLimiter?=string | boolean
 *         - rateLimiterPercent?=number
 *         - retryBaseDelay?=number
 *         - retryControlOpBaseDelay?=number
 *         - retryMaxRetries?=number
 *         - retrySecInfoBaseDelay?=number
 *         - retrySecInfoNumBackoff?=number
 *         - retrySecurityInfoTimeout?=number
 *         - tablePollDelay?=number
 *         - tablePollTimeout?=number
 *         - timeout?=number
 * 
 * Examples:
 *  - nosqldb://us-ashburn-1 or nosqldb+cloud://us-ashburn-1/ - connect to cloud service at Ashburn region using ~/.oci/config file for rest of options
 *  - nosqldb://+instance_principal@us-ashburn-1/compartment_id - for instance principal auth
 *  - nosqldb://+resource_principal@us-ashburn-1/compartment_id - for resource principal auth
 *  - nosqldb://+cloudsim@localhost:8000 - connect to cloudsim on https://localhost:8000
 *  - nosqldb+on_prem://localhost:8080 - connect to on-prem at https://localhost:8080
 *  - nosqldb+on_prem+http://localhost:8080 - connect to on-prem at http://localhost:8080
 *  - nosqldb+on_prem://user:pass@localhost:8080 - connect to on-prem at https://localhost:8080 with user:pass
 */
class NoSQLConnectionString {
    constructor(connectionString) {
        this._connectionString = connectionString;
        this._serviceType = null;
        this._isServiceTypeExplicit = false;
        this._protocol = null;
        this._authType = null;
        this._hosts = [];
        this._region = undefined;
        this._options = new CaseInsensitiveMap();
        this._compartmentOrNs = '';

        if (!connectionString) {
            throw Error('NoSQL DB connection string cannot be empty.');
        }

        if (typeof connectionString !== 'string') {
            throw Error('NoSQL DB connection string parameter not a string.');
        }

        const match = connectionString.match(HOSTS_REGEX);
        if (!match) {
            throw Error(`Invalid NoSQL DB connection string, must start with "${NOSQLDB}" and contain a host name, got: "${connectionString}"`);
        }
        
        const scheme = match.groups?.scheme?.toLowerCase();
        const username = match.groups?.username;
        const password = match.groups?.password;
        const hosts = match.groups?.hosts?.toLowerCase();
        const rest = match.groups?.rest;

        if (!scheme || !scheme.startsWith(NOSQLDB)) {
             throw Error('Invalid scheme, NoSQL DB connection string must start with "' + NOSQLDB + '", got: "' + scheme + '"');
        }

        let schemeParts = scheme.split('+');
        if (schemeParts.length < 1 || schemeParts[0] !== NOSQLDB ) {
            throw Error('Invalid scheme, NoSQL DB connection string must start with "' + NOSQLDB + '", got: "' + schemeParts[0] + '"');
        }

        // figure out the service type and protocol
        for (let i = 1; i < schemeParts.length; i++) {
            if (!this._serviceType && schemeParts[i].toLowerCase() === SERVICE_CLOUD) {
                this._serviceType = SERVICE_CLOUD;
                this._isServiceTypeExplicit = true;
            } else if (!this._serviceType && schemeParts[i].toLowerCase() === SERVICE_ON_PREM) {
                this._serviceType = SERVICE_ON_PREM;
                this._isServiceTypeExplicit = true;
            } else if (!this._protocol && schemeParts[i].toLowerCase() === PROTOCOL_HTTP) {
                this._protocol = PROTOCOL_HTTP;
            } else if (!this._protocol && schemeParts[i].toLowerCase() === PROTOCOL_HTTPS) {
                this._protocol = PROTOCOL_HTTPS;
            } else if (!this._protocol) {
                this._protocol = schemeParts[i];
            }
        }

        if (!this._serviceType) {
            this._serviceType = SERVICE_CLOUD;
        }
        if (!this._protocol) {
            this._protocol = PROTOCOL_HTTPS;
        }


        let authString = '';
        if (username && typeof username === 'string')
            authString += username;
        if (password && typeof password === 'string') 
            authString += `:${password}`;
        if (authString.length > 0)
            authString = authString + '@';

        // figure out the hosts
        this._hosts = hosts.split(',');

        const url = new URL(NOSQLDB + `://${authString}dummyHostname${rest}`);
        
        
        // figure out the auth type
        if (this._serviceType === SERVICE_CLOUD) {
            if (url.username?.toLowerCase() === '+instance_principal') {
                this._authType = AUTH_TYPE_INSTANCE_PRINCIPAL;
            } else if (url.username?.toLowerCase() === '+resource_principal') {
                this._authType = AUTH_TYPE_RESOURCE_PRINCIPAL;
            } else if (url.username?.toLowerCase() === '+oke_workload') {
                this._authType = AUTH_TYPE_OKE_WORKLOAD;
            } else if (url.username?.toLowerCase() === '+cloudsim') {
                this._authType = AUTH_TYPE_CLOUDSIM;
            } else {
                this._authType = AUTH_TYPE_USER_PRINCIPAL;
                this._userName = url.username;
                this._password = url.password;
            }

            if (this._hosts && this._hosts.length > 1) {
                throw Error('Invalid NoSQL DB connection string, for cloud service only one region or endpoint is allowed, got: "'
                    + hosts + '"');
            }

            // figure out region
            this._region = oracleNoSqlDb.Region.fromRegionId(this._hosts[0]);
        } else {
            this._authType = AUTH_TYPE_USER_PRINCIPAL;
            this._userName = url.username;
            this._password = url.password;
        }

        if (!hosts && !(this._authType === AUTH_TYPE_INSTANCE_PRINCIPAL || 
                this._authType === AUTH_TYPE_RESOURCE_PRINCIPAL || 
                this._authType === AUTH_TYPE_OKE_WORKLOAD)) {
            throw Error('Invalid NoSQL DB connection string, must contain a host name, got: "'
                + hosts + '"');
        }

        this._path = url.pathname;
        this._compartmentOrNs = url.pathname.split('/')[1];
        if (!this._compartmentOrNs) {
            this._compartmentOrNs = '';
        }

        for (const key of url.searchParams.keys()) {
            const values = [...url.searchParams.getAll(key)];
            
            // if (values.includes('')) {
            //     throw new Error('URI cannot contain options with no value');
            // }
            
            if (!this._options.has(key)) {
                this._options.set(key, values[0]);
            }
        }
    }

    /**
     * Returns the connected NoSQLClient instance, for the given connection 
     * string. 
     * Note: If Service Type is not explicitly specified it will try connecting
     * to cloud first, if that fails it will try connecting to on-prem.
     * 
     * Trows an error if connection is not successful for both cloud and on-prem.
     */
    async getClient() {
        let client = new oracleNoSqlDb.NoSQLClient(this.getClientConfig());
        // Check connection
        try {
            await client.listNamespaces();
            await client.listTables();
        } catch (error) {
            await client.close();
            // Try on_prem if service type not specified
            if (!this.isServiceTypeExplicit()) {
                this._serviceType = SERVICE_ON_PREM;
                client = new oracleNoSqlDb.NoSQLClient(this.getClientConfig());
                await client.listNamespaces();
                await client.listTables();
            } else {
                throw error;
            }
        }
        return client;
    }

    getClientConfig() {
        let config = {};
        if (this._serviceType === SERVICE_CLOUD) {
            if (this._authType === AUTH_TYPE_CLOUDSIM) {
                config.serviceType = 'CLOUDSIM';
                config.endpoint = this._protocol + '://' + this._hosts[0];
                config.compartment = this._compartmentOrNs;
            } else {
                config.serviceType = 'CLOUD';
                if (this._region) {
                    config.region = this._region;
                } else {
                    config.endpoint = this._hosts[0];
                }

                if (this._authType === AUTH_TYPE_USER_PRINCIPAL) {
                    if (this._options.get(OPTION_CONFIG_FILE)) {
                        config.iam.configFile = this._options.get(OPTION_CONFIG_FILE);
                        if (this._options.get(OPTION_PROFILE)) {
                            config.iam.profileName = this._options.get(OPTION_PROFILE);
                        }
                    } else if (this._options.get(OPTION_TENANCY)) {
                        config.iam.tenantId = this._options.get(OPTION_TENANCY);
                        config.iam.userId = this._options.get(OPTION_USER);
                        config.iam.fingerprint = this._options.get(OPTION_FINGERPRINT);
                        if (this._options.get(OPTION_KEY_FILE)) {
                            config.iam.privateKeyFile = this._options.get(OPTION_KEY_FILE);
                            config.iam.passphrase = this._options.get(OPTION_PASS_PHRASE);
                        }
                    }
                    if (this._compartmentOrNs) {
                        config.compartment = this._compartmentOrNs;
                    }

                } else if (this._authType === AUTH_TYPE_INSTANCE_PRINCIPAL) {
                    config.auth = {
                        iam: {
                            useInstancePrincipal: true
                        }
                    };
                    config.compartment = this._compartmentOrNs;
                } else if (this._authType === AUTH_TYPE_RESOURCE_PRINCIPAL) {
                    config.auth = {
                        iam: {
                            useResourcePrincipal: true
                        }
                    };
                    config.compartment = this._compartmentOrNs;
                } else if (this._authType === AUTH_TYPE_OKE_WORKLOAD) {
                    // this is not implemented in Node SDK: https://github.com/oracle/nosql-node-sdk/blob/cef3d4649d15bca0054f6ff0c707b09299467418/lib/auth/iam/auth_provider.js#L126
                    config.auth = {
                        iam: {
                            useOKEWorkloadInstance: true
                        }
                    };
                    config.compartment = this._compartmentOrNs;
                }   // Node SDK has support for session token
            }
        } else {
            // for on_prem
            config.serviceType = 'KVSTORE';
            
            if (this._userName) {
                config.auth.kvstore.user = this._userName;
                if (this._password) {
                    config.auth.kvstore.password = this._password;
                }
            } else if (this._options.get(OPTION_PEM_CERTIFICATE_FILE)) {    
                config.auth.kvstore.credentials = this._options.get(OPTION_PEM_CERTIFICATE_FILE);
                // this is not implemented in Node SDK: https://github.com/oracle/nosql-node-sdk/blob/cef3d4649d15bca0054f6ff0c707b09299467418/lib/auth/config.js#L223
                // if (this._options.get(OPTION_PEM_CERTIFICATE_PASSPHRASE)) {
                //     config.auth.kvstore.pemPassphrase = this._options.get(OPTION_PEM_CERTIFICATE_PASSPHRASE);
                // }
            }

            if (this._compartmentOrNs) {
                config.namespace = this._compartmentOrNs;
            }
            config.endpoint = this._protocol + '://' + this._hosts[0];
        }

        if (this._options.get(OPTION_ADMIN_POLL_DELAY)) {
            config.adminPollDelay = this._options.get(OPTION_ADMIN_POLL_DELAY);
        }
        if (this._options.get(OPTION_ADMIN_POLL_TIMEOUT)) {
            config.adminPollTimeout = this._options.get(OPTION_ADMIN_POLL_TIMEOUT);
        }
        if (this._options.get(OPTION_CONSISTENCY)) {
            config.consistency = this._options.get(OPTION_CONSISTENCY);
        }
        if (this._options.get(OPTION_NUMBER_LIB)) {
            config.dbNumber = this._options.get(OPTION_NUMBER_LIB);
        }
        if (this._options.get(OPTION_DDL_TIMEOUT)) {
            config.ddlTimeout = this._options.get(OPTION_DDL_TIMEOUT);
        }
        if (this._options.get(OPTION_DURABILITY_MASTER_SYNC)) {
            config.durability.masterSync = this._options.get(OPTION_DURABILITY_MASTER_SYNC);
        }
        if (this._options.get(OPTION_DURABILITY_REPLICA_ACK)) {
            config.durability.replicaAck = this._options.get(OPTION_DURABILITY_REPLICA_ACK);
        }
        if (this._options.get(OPTION_DURABILITY_REPLICA_SYNC)) {
            config.durability.replicaSync = this._options.get(OPTION_DURABILITY_REPLICA_SYNC);
        }
        if (this._options.get(OPTION_HTTP_OPT)) {
            config.httpOptions = JSON.parse(this._options.get(OPTION_HTTP_OPT));
        }
        if (this._options.get(OPTION_LONG_AS_BIG_INT)) {
            config.longIsBigInt = this._options.get(OPTION_LONG_AS_BIG_INT);
        }
        if (this._options.get(OPTION_MAX_MEMORY_MB)) {
            config.maxMemoryMB = this._options.get(OPTION_MAX_MEMORY_MB);
        }
        if (this._options.get(OPTION_RATE_LIMITER)) {
            config.rateLimiter = this._options.get(OPTION_RATE_LIMITER);
        }
        if (this._options.get(OPTION_RATE_LIMITER_PERCENT)) {
            config.rateLimiterPercent = this._options.get(OPTION_RATE_LIMITER_PERCENT);
        }
        if (this._options.get(OPTION_RETRY_BASE_DELAY)) {
            config.retry.baseDelay = this._options.get(OPTION_RETRY_BASE_DELAY);
        }
        if (this._options.get(OPTION_RETRY_CONTROL_OP_BASE_DELAY)) {
            config.retry.controlOpBaseDelay = this._options.get(OPTION_RETRY_CONTROL_OP_BASE_DELAY);
        }
        if (this._options.get(OPTION_RETRY_MAX_RETRIES)) {
            config.retry.maxRetries = this._options.get(OPTION_RETRY_MAX_RETRIES);
        }
        if (this._options.get(OPTION_RETRY_SEC_INFO_BASE_DELAY)) {
            config.retry.secInfoBaseDelay = this._options.get(OPTION_RETRY_SEC_INFO_BASE_DELAY);
        }
        if (this._options.get(OPTION_RETRY_SEC_INFO_NUM_BACKOFF)) {
            config.retry.secInfoNumBackoff = this._options.get(OPTION_RETRY_SEC_INFO_NUM_BACKOFF);
        }
        if (this._options.get(OPTION_RETRY_SECURITY_INFO_TIMEOUT)) {
            config.retry.securityInfoTimeout = this._options.get(OPTION_RETRY_SECURITY_INFO_TIMEOUT);
        }
        if (this._options.get(OPTION_TABLE_POLL_DELAY)) {
            config.retry.securityInfoTimeout = this._options.get(OPTION_TABLE_POLL_DELAY);
        }
        if (this._options.get(OPTION_TABLE_POLL_TIMEOUT)) {
            config.retry.securityInfoTimeout = this._options.get(OPTION_TABLE_POLL_TIMEOUT);
        }
        if (this._options.get(OPTION_TIMEOUT)) {
            config.retry.securityInfoTimeout = this._options.get(OPTION_TIMEOUT);
        }

        return config;
    }

    getConnectionString() {
        return this._connectionString;
    }

    /**
     * Returns true if Service Type was explicitly specified.
     */
    isServiceTypeExplicit() {
        return this._isServiceTypeExplicit;
    }

    /**
     * Returns the kind of Service Type specified or infered.
     */
    getServiceType() {
        return this._serviceType;
    }

    getProtocol() {
        return this._protocol;
    }

    getAuthType() {
        return this._authType;
    }

    getUserName() {
        return this._userName;
    }

    getPassword() {
        return this._password;
    }

    getHosts() {
        return this._hosts;
    }

    getRegion() {
        return this._region;
    }

    getOptions() {
        return this._options;
    }

    
    /**
     * Returns the path associated with this connection string.
     * @returns {string} The path.
     */
    getPath() {
        return this._path;
    }

    /**
     * Returns the compartment or namespace specified in the connection string. Same as getNamespace().
     * 
     * Example: "nosqldb://us-phoenix-1/compartment/" or "nosqldb+on_prem://localhost:5000/dev_namespace?".
     */
    getCompartment() {
        return this._compartmentOrNs;
    }

    /**
     * Returns the compartment or namespace specified in the connection string. Same as getCompartment().
     * Example: "nosqldb://us-phoenix-1/compartment/" or "nosqldb+on_prem://localhost:5000/dev_namespace?".
     */
    getNamespace() {
        return this._compartmentOrNs;
    }
}

class CaseInsensitiveMap extends Map {
    constructor(entries = []) {
      super(entries.map(([k, v]) => [k.toLowerCase(), v]));
    }

    has(k) {
        if (typeof k !== 'string') {
            throw Error('Key must be a string.');
        }
        return super.has(k.toLowerCase());
    }

    get(k) {
        if (typeof k !== 'string') {
            throw Error('Key must be a string.');
        }
        return super.get(k.toLowerCase());
    }
    
    set(k, v) {
        if (typeof k !== 'string' || typeof v !== 'string') {
            throw Error('Key and value must be strings.');
        }
        return super.set(k.toLowerCase(), v);
    }
    
    delete(k) {
        if (typeof k !== 'string') {
            throw Error('Key must be a string.');
        }
        return super.delete(k.toLowerCase());
    }
}


module.exports.NoSQLConnectionString = NoSQLConnectionString;
module.exports.NOSQLDB = NOSQLDB;
module.exports.SERVICE_CLOUD = SERVICE_CLOUD;
module.exports.SERVICE_ON_PREM = SERVICE_ON_PREM;
module.exports.PROTOCOL_HTTP = PROTOCOL_HTTP;
module.exports.PROTOCOL_HTTPS = PROTOCOL_HTTPS;
module.exports.AUTH_TYPE_USER_PRINCIPAL = AUTH_TYPE_USER_PRINCIPAL;
module.exports.AUTH_TYPE_INSTANCE_PRINCIPAL = AUTH_TYPE_INSTANCE_PRINCIPAL;
module.exports.AUTH_TYPE_RESOURCE_PRINCIPAL = AUTH_TYPE_RESOURCE_PRINCIPAL;
module.exports.AUTH_TYPE_OKE_WORKLOAD = AUTH_TYPE_OKE_WORKLOAD;
module.exports.AUTH_TYPE_CLOUDSIM = AUTH_TYPE_CLOUDSIM;

module.exports.OPTION_CONFIG_FILE = OPTION_CONFIG_FILE;
module.exports.OPTION_PROFILE = OPTION_PROFILE;
module.exports.OPTION_TENANCY = OPTION_TENANCY;
module.exports.OPTION_USER = OPTION_USER;
module.exports.OPTION_FINGERPRINT = OPTION_FINGERPRINT;
module.exports.OPTION_KEY_FILE = OPTION_KEY_FILE;
module.exports.OPTION_PASS_PHRASE = OPTION_PASS_PHRASE;
module.exports.OPTION_PEM_CERTIFICATE_FILE = OPTION_PEM_CERTIFICATE_FILE;
// module.exports.OPTION_PEM_CERTIFICATE_PASSWORD = OPTION_PEM_CERTIFICATE_PASSWORD; // Not impl by Node SDK
module.exports.OPTION_ADMIN_POLL_DELAY = OPTION_ADMIN_POLL_DELAY;
module.exports.OPTION_ADMIN_POLL_TIMEOUT = OPTION_ADMIN_POLL_TIMEOUT;
module.exports.OPTION_CONSISTENCY = OPTION_CONSISTENCY;
module.exports.OPTION_DDL_TIMEOUT = OPTION_DDL_TIMEOUT;
module.exports.OPTION_DURABILITY_MASTER_SYNC = OPTION_DURABILITY_MASTER_SYNC;
module.exports.OPTION_DURABILITY_REPLICA_ACK = OPTION_DURABILITY_REPLICA_ACK;
module.exports.OPTION_DURABILITY_REPLICA_SYNC = OPTION_DURABILITY_REPLICA_SYNC;
module.exports.OPTION_HTTP_OPT = OPTION_HTTP_OPT;
module.exports.OPTION_LONG_AS_BIG_INT = OPTION_LONG_AS_BIG_INT;
module.exports.OPTION_MAX_MEMORY_MB = OPTION_MAX_MEMORY_MB;
module.exports.OPTION_NUMBER_LIB = OPTION_NUMBER_LIB;
module.exports.OPTION_RATE_LIMITER = OPTION_RATE_LIMITER;
module.exports.OPTION_RATE_LIMITER_PERCENT = OPTION_RATE_LIMITER_PERCENT;
module.exports.OPTION_RETRY_BASE_DELAY = OPTION_RETRY_BASE_DELAY;
module.exports.OPTION_RETRY_CONTROL_OP_BASE_DELAY = OPTION_RETRY_CONTROL_OP_BASE_DELAY;
module.exports.OPTION_RETRY_MAX_RETRIES = OPTION_RETRY_MAX_RETRIES;
module.exports.OPTION_RETRY_SEC_INFO_BASE_DELAY = OPTION_RETRY_SEC_INFO_BASE_DELAY;
module.exports.OPTION_RETRY_SEC_INFO_NUM_BACKOFF = OPTION_RETRY_SEC_INFO_NUM_BACKOFF;
module.exports.OPTION_RETRY_SECURITY_INFO_TIMEOUT = OPTION_RETRY_SECURITY_INFO_TIMEOUT;
module.exports.OPTION_TABLE_POLL_DELAY = OPTION_TABLE_POLL_DELAY;
module.exports.OPTION_TABLE_POLL_TIMEOUT = OPTION_TABLE_POLL_TIMEOUT;
module.exports.OPTION_TIMEOUT = OPTION_TIMEOUT;