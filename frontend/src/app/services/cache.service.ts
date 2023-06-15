import { Injectable } from '@angular/core';
import { RawVerificationStatus, VerificationStatus } from '../model/verificationstatus';
import { VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { PassbaseVerificationStatus } from '../model/passbase/passbaseverificationstatus';

@Injectable({
    providedIn: 'root'
})
export class CacheService {
    private static cachedData: { [key: string]: VerificationStatus } = {};

    constructor() {
    }

    private static parseVerificationStatusResult(result: any): VerificationStatus {
        const status = JSON.parse(result) as RawVerificationStatus;
        const finalResult = {
            passbase: {
                status: PassbaseVerificationStatus.APPROVED,
            },
            credentials: status.credentials.map(c => VerifiableCredential.parse(c))
        }
        return finalResult;
    }

    private static get(key: string): any {
        if (!CacheService.cachedData[key]) {
            const value = localStorage.getItem(key);
            if (!value) return null;

            CacheService.cachedData[key] = CacheService.parseVerificationStatusResult(value);
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