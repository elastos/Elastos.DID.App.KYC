import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { MongoClient } from "mongodb";
import { SecretConfig } from "../config/env-secret";
import logger from "../logger";
import { Credential } from "../model/credential";
import { DataOrError, ErrorType } from "../model/dataorerror";
import { User } from "../model/user";

class DBService {
    private client: MongoClient;

    constructor() {
        let mongoConnectionUrl;
        if (SecretConfig.Mongo.user)
            mongoConnectionUrl = `mongodb://${SecretConfig.Mongo.user}:${SecretConfig.Mongo.password}@${SecretConfig.Mongo.host}:${SecretConfig.Mongo.port}/${SecretConfig.Mongo.dbName}?authSource=admin`;
        else
            mongoConnectionUrl = `mongodb://${SecretConfig.Mongo.host}:${SecretConfig.Mongo.port}/${SecretConfig.Mongo.dbName}`;

        console.log("mongoConnectionUrl", mongoConnectionUrl);

        this.client = new MongoClient(mongoConnectionUrl, {
            //useNewUrlParser: true, useUnifiedTopology: true
        });
    }

    public async checkConnect(): Promise<DataOrError<void>> {
        try {
            await this.client.connect();
            await this.client.db().collection('users').find({}).limit(1);
            return {};
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: 'mongodb connect failed' };
        } finally {
            await this.client.close();
        }
    }

    public async updateUser(did: string, email: string): Promise<number> {
        try {
            await this.client.connect();
            const collection = this.client.db().collection('users');
            let result = await collection.updateOne({ did }, { $set: { email } });
            return result.matchedCount;
        } catch (err) {
            logger.error(err);
            return -1;
        } finally {
            await this.client.close();
        }
    }

    public async findUserByDID(did: string): Promise<DataOrError<User>> {
        try {
            await this.client.connect();
            const collection = this.client.db().collection<User>('users');
            return {
                data: (await collection.find({ did }).project<User>({ '_id': 0 }).limit(1).toArray())[0]
            };
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: "server error" };
        } finally {
            await this.client.close();
        }
    }

    public async addUser(user: User): Promise<DataOrError<void>> {
        try {
            await this.client.connect();
            const collection = this.client.db().collection('users');
            const docs = await collection.find({ did: user.did }).toArray();
            if (docs.length === 0) {
                await collection.insertOne(user);
                return {};
            } else {
                return { errorType: ErrorType.STATE_ERROR, error: 'DID or Telegram exists' }
            }
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: 'server error' };
        } finally {
            await this.client.close();
        }
    }

    public async setPassbaseUUID(did: string, passbaseUUID: string): Promise<DataOrError<void>> {
        try {
            await this.client.connect();
            const usersCollection = this.client.db().collection('users');
            const updateResult = await usersCollection.updateOne({ did: did }, {
                $set: {
                    passbaseUUID
                }
            });
            if (!updateResult || updateResult.matchedCount === 0) {
                return { errorType: ErrorType.STATE_ERROR, error: 'User not found' };
            } else {
                return {};
            }
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: 'server error' };
        } finally {
            await this.client.close();
        }
    }

    public async getUserCredentials(did: string): Promise<DataOrError<Credential[]>> {
        try {
            await this.client.connect();
            const collection = this.client.db().collection('credentials');
            const credentials = await collection.find({ owner: did }).project({ _id: 0 }).toArray() as Credential[];
            return { data: credentials };
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: "Server error" };
        } finally {
            await this.client.close();
        }
    }

    public async saveCredentials(did: string, newCredentials: VerifiableCredential[]): Promise<DataOrError<void>> {
        try {
            await this.client.connect();
            const credentialsCollection = this.client.db().collection('credentials');

            let dbCredentials: Credential[] = newCredentials.map(vc => {
                return { owner: did, vc: vc.toString() }
            });

            await credentialsCollection.insertMany(dbCredentials);
            return {};
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: "Server error" };
        } finally {
            await this.client.close();
        }
    }
}

export const dbService = new DBService();
