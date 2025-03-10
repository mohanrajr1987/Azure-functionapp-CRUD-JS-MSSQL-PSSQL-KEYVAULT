const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config();

class ConfigManager {
    constructor() {
        this.secrets = {};
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Try Azure Key Vault first
            if (process.env.AZURE_KEYVAULT_URL) {
                const credential = new DefaultAzureCredential();
                const client = new SecretClient(process.env.AZURE_KEYVAULT_URL, credential);

                // Fetch secrets from Key Vault
                const secrets = [
                    'DB-SERVER',
                    'DB-NAME',
                    'DB-USER',
                    'DB-PASSWORD',
                    'JWT-SECRET',
                    'JWT-REFRESH-SECRET'
                ];

                for (const secretName of secrets) {
                    try {
                        const secret = await client.getSecret(secretName);
                        this.secrets[secretName] = secret.value;
                    } catch (error) {
                        console.log(`Warning: Could not fetch ${secretName} from Key Vault`);
                    }
                }
            }
        } catch (error) {
            console.log('Warning: Azure Key Vault access failed, falling back to environment variables');
        }

        // Fall back to environment variables for any missing secrets
        this.secrets = {
            'DB-SERVER': this.secrets['DB-SERVER'] || process.env.DB_SERVER,
            'DB-NAME': this.secrets['DB-NAME'] || process.env.DB_NAME,
            'DB-USER': this.secrets['DB-USER'] || process.env.DB_USER,
            'DB-PASSWORD': this.secrets['DB-PASSWORD'] || process.env.DB_PASSWORD,
            'JWT-SECRET': this.secrets['JWT-SECRET'] || process.env.JWT_SECRET,
            'JWT-REFRESH-SECRET': this.secrets['JWT-REFRESH-SECRET'] || process.env.JWT_REFRESH_SECRET
        };

        this.isInitialized = true;
    }

    async getSecret(name) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.secrets[name];
    }

    async getDatabaseConfig() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const dbType = process.env.DB_TYPE || 'mssql';

        if (dbType === 'mssql') {
            return {
                type: 'mssql',
                server: this.secrets['DB-SERVER'] || process.env.MSSQL_SERVER,
                database: this.secrets['DB-NAME'] || process.env.MSSQL_DATABASE,
                user: this.secrets['DB-USER'] || process.env.MSSQL_USER,
                password: this.secrets['DB-PASSWORD'] || process.env.MSSQL_PASSWORD,
                options: {
                    encrypt: true
                }
            };
        } else if (dbType === 'postgres') {
            return {
                type: 'postgres',
                host: process.env.PG_HOST,
                database: process.env.PG_DATABASE,
                user: process.env.PG_USER,
                password: process.env.PG_PASSWORD,
                port: parseInt(process.env.PG_PORT || '5432'),
                ssl: process.env.NODE_ENV === 'production'
            };
        } else {
            throw new Error(`Unsupported database type: ${dbType}`);
        }
    }
    }

    async getJwtConfig() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return {
            secret: this.secrets['JWT-SECRET'],
            refreshSecret: this.secrets['JWT-REFRESH-SECRET']
        };
    }

    getAppInsightsKey() {
        return process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    }

    getNodeEnv() {
        return process.env.NODE_ENV || 'development';
    }
}

const configManager = new ConfigManager();
module.exports = configManager;
