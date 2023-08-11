import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { MongoClient } from "mongodb";
import { SecretConfig } from "../config/env-secret";
import logger from "../logger";
import { Credential } from "../model/credential";
import { DataOrError, ErrorType } from "../model/dataorerror";
import { PassbaseVerificationStatus } from "../model/passbase/passbaseverificationstatus";
import { User } from "../model/user";
import { TransactionMap } from "../model/ekyc/transactionmap";
import { DocType } from "../model/ekyc/ekycproductcode";
import { EKYCResultMap } from "../model/ekyc/ekycresultmap";
import { EkycRawResult } from "../model/ekyc/ekycresult";

class DBService {
    private client: MongoClient;

    constructor() {
        let mongoConnectionUrl;
        if (SecretConfig.Mongo.user)
            mongoConnectionUrl = `mongodb://${SecretConfig.Mongo.user}:${SecretConfig.Mongo.password}@${SecretConfig.Mongo.host}:${SecretConfig.Mongo.port}/${SecretConfig.Mongo.dbName}?authSource=admin`;
        else
            mongoConnectionUrl = `mongodb://${SecretConfig.Mongo.host}:${SecretConfig.Mongo.port}/${SecretConfig.Mongo.dbName}`;

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

    // deprecated passsbase
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

    // deprecated passbase
    public async setPassbaseVerificationStatus(did: string, status: PassbaseVerificationStatus): Promise<DataOrError<void>> {
        logger.info(`Setting passbase verification status for DID ${did} to ${status}`);
        try {
            await this.client.connect();
            const usersCollection = this.client.db().collection('users');
            const updateResult = await usersCollection.updateOne({ did: did }, {
                $set: {
                    passbaseVerificationStatus: status
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

    // deprecated passbase
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

    // deprecated passbase
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

    public async saveTransactionUserMapping(transactionId: string, did: string, docType: string): Promise<DataOrError<void>> {
        try {
            await this.client.connect();
            const transactionsCollection = this.client.db().collection('transactions');

            const transactionMap: TransactionMap = {
                transactionId: transactionId,
                did: did,
                docType: docType
            };
            await transactionsCollection.insertOne(transactionMap);
            return {};
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: "Server error" };
        } finally {
            await this.client.close();
        }
    }

    public async getTransactionUserMapping(transactionId: string): Promise<DataOrError<{ did: string, docType: string }>> {
        try {
            await this.client.connect();
            const transactionsCollection = this.client.db().collection('transactions');
            const transactionMap = (await transactionsCollection.find({ transactionId: transactionId }).project<TransactionMap>({ _id: 0 }).limit(1).toArray())[0];
            return { data: { did: transactionMap.did, docType: transactionMap.docType || DocType.Passport } };
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: "Server error" };
        } finally {
            await this.client.close();
        }
    }



    public async saveEKYCResultMapping(transactionId: string, result: EkycRawResult): Promise<DataOrError<void>> {
        try {
            await this.client.connect();
            const ekycResultCollection = this.client.db().collection('ekycnosensitiveresult');

            const ekycResult: EKYCResultMap = {
                transactionId: transactionId,
                result: result
            };
            await ekycResultCollection.insertOne(ekycResult);
            return {};
        } catch (err) {
            logger.error(err);
            return { errorType: ErrorType.SERVER_ERROR, error: "Server error" };
        } finally {
            await this.client.close();
        }
    }

    public async getEKYCResultFromTxId(transactionId: string): Promise<EkycRawResult> {
        try {
            await this.client.connect();
            const ekycResultCollection = this.client.db().collection('ekycnosensitiveresult');
            const ekycResultMap = (await ekycResultCollection.find({ transactionId: transactionId }).project<EKYCResultMap>({ _id: 0 }).limit(1).toArray())[0];
            if (!ekycResultMap || !ekycResultMap.result)
                return null;
            return ekycResultMap.result;
        } catch (err) {
            logger.error(err);
            return null;
        } finally {
            await this.client.close();
        }
    }
}

export const dbService = new DBService();
