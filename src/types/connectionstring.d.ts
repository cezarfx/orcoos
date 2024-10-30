import { Config, NoSQLClient } from "oracle-nosqldb";
import string from "../../lib/cast/string";


declare module 'orcoos' {

    /**
     * This file implements the NoSQL DB connection string spec.
     * 
     * # NoSQL DB Connection string
     * 
     * ## Format:  
     * 
     * ```
     * nosqldb[+connection_type][+protocol]://[auth@]host1:port1[,....hostN[:portN]][/compartment_or_namespace/reserved[?[paramspec]]]
     * ```
     * 
     * - `nosqldb[+connection_type][+protocol]` - the scheme of the connection string, case insensitive.
     *      - `nosqldb` - required, error if not present
     *      - `connection_type` - on_prem|cloud - optional, cloud is default if not specified
     *      - `protocol` - http|https - optional, https is default if not specified.
     * - `auth` - authentication type, optional - user auth by default if not specified
     *      - `username[:password]` - user name and optional password, strongly advised not to be used in production but it is included here for simplicity at develop time
     *      - `+instance_principal | +resource_principal | +oke_workload` - valid only if connection_type is cloud, valid without a hostname impling the local instance/resource/OKE workload instance
     *      - `+cloudsim` - using this option will ignore cloud auth options, ex: configFile,tenancy,user, etc.
     * - `host1[:port1][, ...hostN[:portN]]` - hostnames (case insensitive) and their port numbers, at least one hostname is required, depending on the connection type (see below) these values have the following semantics:
     *     - `host` - if connection_type is cloud host will be checked as a known region identifier. Example: us-ashburn-1
     *            - if it is not found as a region identifier it is interpreted as a direct endpoint
     *            - if connection_type is cloud only one region/endpoint is allowed
     *     - `port` - optional port number, if not specified the default port for the protocol is used
     * - `compartment_or_namespace` 
     *     - for cloud the compartment name or oci compartment_id. OCI compartment_id is required when using instance, resource principal or OKE workload instance auth.
     *     - for on_prem the defualt namespace name.
     * - `reserved` - optional reserved for future extensions (ex: /table_name/pk)
     * - `paramspec` - optional list of options: option_name1[=option_value1][,...option_nameN=option_nameN], ignored if not known, option names are case insensitive
     *     - for cloud:
     *         - `configFile?[=~/.oci/config]` - specifies the location of the config file, if value not specified the default ~/.oci/config location is used
     *         - `profile?=profile_name` - specifies the profile name to be used from config file, if not specified DEFAULT profile is used.
     *         - all entries allowed in config file other then region:(if config option is specified the following are ignored)
     *             - `tenancy=tenancy_id` - specifies the OCID of your tenancy.
     *             - `user=user_id` - specifies the OCID of the user calling the API. 
     *             - `fingerprint=fingerprint_value` - specifies the fingerprint for the public key that was added to this user.
     *             - `key_file=full_path` - specifies the full path and filename of the private key.
     *             - `pass_phrase=passphrase` - specifies the passphrase used for the key, if it is encrypted.
     *             - `security_token_file?=file_name` - If session token authentication is being used, then this parameter is required.
     *     - for cloudsim:
     *             - all cloud options work or be ignored if not applicable
     *     - for on_prem:
     *         - `pemCertificateFile?=fileName`
     *         - `pemCertificatePassword?=passphrase`
     *     - for all connection types (all of these are defined here): 
     *         - `adminPollDelay?=number` 
     *         - `adminPollTimeout?=number`
     *         - `consistency?=string` - EVENTUAL(default) | ABSOLUTE
     *         - `numberLib?=string` - for NodeJS SDK only - number library to use
     *         - `ddlTimeout?=number`
     *         - `durabilityMasterSync?=string` - if not set: durability on server is used, else: NO_SYNC | SYNC | WRITE_NO_SYNC
     *         - `durabilityReplicaAck?=string` - if not set: durability on server is used, else: ALL | NONE | SIMPLE_MAJORITY
     *         - `durabilityReplicaSync?=string` - if not set: durability on server is used, else: NO_SYNC | SYNC | WRITE_NO_SYNC
     *         - `httpOpt?`  - Http/Https options
     *         - `longAsBigInt?=boolean` - for NodeJS SDK only
     *         - `maxMemoryMB?=number` 
     *         - `protocol?=string` - specify the protocol to use, if not specified http is used for on_prem and cloudsim and https for the rest. Only http and https are valid for now.
     *         - `rateLimiter?=string | boolean`
     *         - `rateLimiterPercent?=number`
     *         - `retryBaseDelay?=number`
     *         - `retryControlOpBaseDelay?=number`
     *         - `retryMaxRetries?=number`
     *         - `retrySecInfoBaseDelay?=number`
     *         - `retrySecInfoNumBackoff?=number`
     *         - `retrySecurityInfoTimeout?=number`
     *         - `tablePollDelay?=number`
     *         - `tablePollTimeout?=number`
     *         - `timeout?=number`
     * 
     * Examples:
     *  - [`nosqldb://us-ashburn-1`]() or [`nosqldb+cloud://us-ashburn-1/`]() - connect to cloud service at Ashburn region using ~/.oci/config file for rest of options
     *  - [`nosqldb://+instance_principal@us-ashburn-1/compartment_id`]() - for instance principal auth
     *  - [`nosqldb://+resource_principal@us-ashburn-1/compartment_id`]() - for resource principal auth
     *  - [`nosqldb://+cloudsim@localhost:8000`]() - connect to cloudsim on https://localhost:8000
     *  - [`nosqldb+on_prem://localhost:8080`]() - connect to on-prem at https://localhost:8080
     *  - [`nosqldb+on_prem+http://localhost:8080`]() - connect to on-prem at http://localhost:8080
     *  - [`nosqldb+on_prem://user:pass@localhost:8080`]() - connect to on-prem at https://localhost:8080 with user:pass
     */
    class NoSQLConnectionString {
        constructor(connectionString: string) ;

        /**
         * Returns the connected NoSQLClient instance, for the given connection 
         * string. 
         * Note: If Connection Type is not explicitly specified it will try connecting
         * to cloud first, if that fails it will try connecting to on-prem.
         * 
         * Throws an error if connection is not successful for both cloud and on-prem.
         */
        async getClient(options) : Promise<NoSQLClient>;

        /**
         * Creates and returns a config object based on this NoSQLConnectionString and optional parameter. 
         * If a certain option is specified in connectOptions it takes precendece over the connectionString URL option.
         */
        getClientConfig(connectOptions = {}) : Config;

        /**
         * Returns the string used to create this instance.
         */
        getConnectionString(): string;

        /**
         * Returns true if Connection Type was explicitly specified.
         */
        isConnectionTypeExplicit(): boolean ;

        /**
         * Returns the kind of connection specified or infered: 'cloud' or 'on_prem';
         */
        getConnectionType(): string;

        /**
         * Returns the protocol specified or infered: 'https' or 'http';
         */
        getProtocol(): string;

        /**
         * Returns the kind of auth specified or infered:
         * 'user_principal', 'instance_principal', 'resource_principal', 'oke_workload' or 'cloudsim';
         */
        getAuthType(): string;

        /**
         * Returns the username specified or infered.
         */
        getUserName(): string;

        /**
         * Returns the password specified or infered.
         */
        getPassword(): string;

        /**
         * Returns the hosts array.
         */
        getHosts(): string[];

        /**
         * Returns the region if specified.
         */
        getRegion(): string;

        /**
         * Returns the options specified or infered.
         */
        getOptions(): CaseInsensitiveMap<string>;
        
        /**
         * Returns the path associated with this connection string, including the compartment/namespace.
         * Example: nosqldb+cloud://+cloudsim@127.0.0.1:8081/orcoos/a/b/c returns /orcoos/a/b/c
         * @returns {string} The path.
         */
        getPath(): string;

        /**
         * Returns the compartment or namespace specified in the connection string. Same as getNamespace().
         * 
         * Example: "nosqldb://us-phoenix-1/compartment/" or "nosqldb+on_prem://localhost:5000/dev_namespace?".
         */
        getCompartment(): string;

        /**
         * Returns the compartment or namespace specified in the connection string. Same as getCompartment().
         * Example: "nosqldb://us-phoenix-1/compartment/" or "nosqldb+on_prem://localhost:5000/dev_namespace?".
         */
        getNamespace(): string;
    }

    /**
     * A case insensituve map, used for connection string options.
     */
    class CaseInsensitiveMap extends Map<string, string> {
        constructor(entries: string[] = []);

        has(k: string): boolean;

        get(k: string): string;
        
        set(k: string, v: string): this;
        
        delete(k: string): boolean;
    }
}