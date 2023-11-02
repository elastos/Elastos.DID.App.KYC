import { Injectable } from '@angular/core';
import { RawVerificationStatus, VerificationStatus } from '../model/verificationstatus';
import { VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { ProviderType } from '../model/providertype';
import { ProviderVerificationStatus } from '../model/providerverificationstatus';

@Injectable({
    providedIn: 'root'
})
export class CacheService {
    private static cachedData: { [key: string]: VerificationStatus } = {};

    constructor() {
    }

    private static parseVerificationStatusResult(result: string): VerificationStatus {
        try {
            if (!result) {
                return null;
            }

            const status = JSON.parse(result) as RawVerificationStatus;
            if (result.includes("extInfo")) {
                const finalResult = {
                    extInfo: {
                        providertype: status.extInfo.providertype,
                        status: status.extInfo.status
                    },
                    credentials: status.credentials.map(c => VerifiableCredential.parse(c))
                }
                return finalResult;
            }

            const credentials = status.credentials.map(c => VerifiableCredential.parse(c))
            if (credentials.length > 0) {
                const finalResult = {
                    extInfo: {
                        providertype: ProviderType.UNKNOWN,
                        status: ProviderVerificationStatus.APPROVED
                    },
                    credentials: status.credentials.map(c => VerifiableCredential.parse(c))
                }
                return finalResult;
            }

            return null;
        } catch (error) {
            console.log("Parse verification result error", error);
            return null;
        }
    }

    private static get(key: string): any {
        if (!CacheService.cachedData[key]) {
            const value: string = localStorage.getItem(key);
            if (!value) return null;

            const verificationStatus = CacheService.parseVerificationStatusResult(value);
            if (verificationStatus)
                CacheService.cachedData[key] = verificationStatus
        }
        return CacheService.cachedData[key];
    }

    private static set(key: string, value: any): any {
        try {
            localStorage.setItem(key, value);
            return CacheService.cachedData[key] = CacheService.parseVerificationStatusResult(value);;
        } catch (error) {
            console.log('Error saving to localStorage', error);
        }
    }

    private static clear(): void {
        CacheService.cachedData = {};
        localStorage.clear();
    }

    public static setVerificationStatus(did: string, response: any): VerificationStatus {
        const didData = did.replace('did:elastos:', '');
        const key = didData + 'cachedVerification';
        CacheService.set(key, response);
        return CacheService.cachedData[key];
    }

    public static getVerificationStatus(did: string): VerificationStatus {
        const didData = did.replace('did:elastos:', '');
        return CacheService.get(didData + 'cachedVerification');
    }
}