/* eslint-disable @typescript-eslint/no-misused-promises */
import { Exceptions, JSONObject, VerifiableCredential, VerifiablePresentation } from '@elastosfoundation/did-js-sdk';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { SecretConfig } from '../config/env-secret';
import logger from '../logger';
import { PassbaseVerificationStatus } from '../model/passbase/passbaseverificationstatus';
import { User } from '../model/user';
import { VerificationStatus } from '../model/verificationstatus';
import { dbService } from '../services/db.service';
// eslint-disable-next-line import/namespace
import { passbaseService } from '../services/passbase.service';
import { apiError } from '../utils/api';
import { ekycService } from '../services/ekyc.service';
import { EKYCResult, EkycRawResult, EkycResponse } from '../model/ekyc/ekycresult';
import { EKYCResponseType } from '../model/ekycresponsetype';
import { CommonUtils } from '../utils/commonutils';
import { ProviderType } from '../model/providertype';
import { OverallStatus } from '../model/overallstatus';
import { ProviderVerificationStatus } from '../model/providerverificationstatus';

let router = Router();

/* Used for service check. */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/check', async (req, res) => {
    res.json(await dbService.checkConnect());
});

router.post('/login', async (req, res) => {
    let presentationStr = req.body;
    if (!presentationStr) {
        return res.json({ code: 403, message: 'Missing presentation' });
    }

    try {
        let vp = VerifiablePresentation.parse(presentationStr);
        let valid = await vp.isValid();
        if (!valid) {
            return res.json({ code: 403, message: 'Invalid presentation' });
        }

        let did = vp.getHolder().toString();
        if (!did) {
            return res.json({ code: 400, message: 'Unable to extract owner DID from the presentation' })
        }

        // First check if we know this user yet or not. If not, we will create an entry
        let existingUserDataOrError = await dbService.findUserByDID(did);
        if (existingUserDataOrError.error) {
            console.log("User data error, ", existingUserDataOrError);
            return apiError(res, existingUserDataOrError);
        }


        // Optional email
        let emailCredential = vp.getCredential(`email`);
        let email = emailCredential ? emailCredential.getSubject().getProperty('email') : '';

        let existingUser = existingUserDataOrError.data;
        let user: User;

        if (existingUser) {
            // Nothing to do yet
            logger.info("Existing user is signing in", existingUser);
            user = existingUser;

            // Update email in DB - we don't mind the result
            await dbService.updateUser(user.did, email);
            user.email = email;
        }
        else {
            logger.info("Unknown user is signing in with DID", did, ". Creating a new user");

            user = {
                did,
                email
            };
            let dataOrError = await dbService.addUser(user);
            if (dataOrError.error) {
                console.log("Add user error, ", dataOrError);
                return apiError(res, dataOrError);
            }
        }
        let token = jwt.sign(user, SecretConfig.Auth.jwtSecret, { expiresIn: 60 * 60 * 24 * 7 });
        res.json(token);
    }
    catch (e) {
        // Possibly invalid presentation
        if (e instanceof Exceptions.MalformedPresentationException)
            return res.status(403).json("Malformed presentation");
        else {
            console.log("Login error, ", e);
            return res.status(500).json("Server error");
        }
    }
})

/* router.get('/user/verificationstatus', async (req, res) => {
    let userDid = req.user.did;

    // Retrieve the user from DB
    let existingUserDataOrError = await dbService.findUserByDID(userDid);
    if (existingUserDataOrError.error)
        return apiError(res, existingUserDataOrError);

    let user = existingUserDataOrError.data;

    if (!user.passbaseUUID || user.passbaseUUID === "") {
        return res.json({
            passbase: "unverified"
        });
    }
    else {
        // We have a passbase UUID, this means the user has tried to get verified.
        // Now check if it's completed/approved, or not yet.
        if (user.passbaseStatus === "approved") {
            return res.json({
                passbase: "verified"
            });
        }
        else if (user.passbaseStatus === "created" || user.passbaseStatus === "declined"){
            return res.json({
                passbase: "declined"
            });
        }
        else {
            // processing
            return res.json({
                passbase: "pending"
            });
        }
    }
}); */

/**
 * This API returns the verification status for each provider, but at the same time it also returns
 * the whole list of credentials, that already existed, or that were just fetched/updated.
 */
// deprecated passbase
// router.get('/user/verificationstatus', async (req, res) => {
//     let userDid = req.user.did;

//     // Methodology to get/create new credentials:
//     // - Load existing credentials from DB
//     // - Check latest data from passbase for this user, in case new content appeared
//     // - For each credential that seems to be missing, generate it and add it to the DB
//     // - Return everything to this api
//     let userDataOrError = await dbService.findUserByDID(userDid);
//     if (userDataOrError.error)
//         return apiError(res, userDataOrError);

//     let user = userDataOrError.data!;
//     if (!user) {
//         res.status(403).send('User not found');
//         return;
//     }

//     let dbCredentialsDataOrError = await dbService.getUserCredentials(userDid);
//     if (dbCredentialsDataOrError.error)
//         return apiError(res, dbCredentialsDataOrError);

//     let verificationStatus: VerificationStatus = {
//         passbase: {
//             status: PassbaseVerificationStatus.UNKNOWN
//         },
//         credentials: []
//     };

//     let dbCredentials = dbCredentialsDataOrError.data!.map(c => VerifiableCredential.parse(c.vc as JSONObject));
//     logger.debug("Current user credentials in DB:", dbCredentials);

//     // PASSBASE
//     let newPassbaseCredentials: VerifiableCredential[] = [];
//     if (user.passbaseUUID) {
//         newPassbaseCredentials = await passbaseService.fetchNewUserCredentials(user, dbCredentials);
//         if (newPassbaseCredentials.length > 0) {
//             // Add new passbase credentials to DB
//             await dbService.saveCredentials(userDid, newPassbaseCredentials);
//         }
//     }
//     verificationStatus.passbase.status = user.passbaseVerificationStatus || PassbaseVerificationStatus.UNKNOWN;

//     // FINALIZE
//     let allCredentials = [...dbCredentials, ...newPassbaseCredentials];

//     // Sort by most recent first
//     allCredentials.sort((c1, c2) => c2.getIssuanceDate().valueOf() - c1.getIssuanceDate().valueOf());

//     verificationStatus.credentials = allCredentials.map(c => c.toJSON());

//     res.json(verificationStatus);
// });

/**
 * Returns a base64 encoded metadata, encrypted with a secret key provided by passbase,
 * so that passbase can decrypt this content and send it back in hooks/passbase apis.
 */
router.get('/user/passbase/metadata', (req, res) => {
    let userDid = req.user.did;

    let metadata = {
        did: userDid
    };

    let encryptedMetadata = passbaseService.encryptMetadata(metadata);

    res.json(encryptedMetadata);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/user/passbase/uuid', async (req, res) => {
    let userDid = req.user.did;
    let passbaseUUID = req.body.passbaseUUID;

    if (!passbaseUUID) {
        return res.json({
            code: 403,
            message: "passbaseUUID is missing"
        });
    }

    let dataOrError = await dbService.setPassbaseUUID(userDid, passbaseUUID)
    if (dataOrError.error)
        return apiError(res, dataOrError);

    res.json();
});

router.post('/user/ekyc/idocr', async (req, res) => {
    let metaInfo = req.body;

    if (!metaInfo) {
        return res.json({ code: 403, message: 'Missing metaInfo' });
    }

    try {
        const response = await ekycService.processIdOcr(metaInfo);
        res.json(response);
    }
    catch (e) {
        return res.status(500).json("Server error");
    }
});

router.post('/user/ekyc/ekyc', async (req, res) => {
    const requestBody = req.body;
    let metaInfo = requestBody.metaInfo;
    let merchantUserId = requestBody.merchantUserId;
    console.log("ekyc request params are ", metaInfo, merchantUserId);

    if (!metaInfo)
        return res.json({ code: 403, message: 'Missing metaInfo' });

    if (!merchantUserId)
        return res.json({ code: 403, message: 'Missing merchantUserId' });

    try {
        if (merchantUserId != req.user.did) {
            const response = {
                code: EKYCResponseType.DID_NOT_MATCH,
                data: ""
            }
            res.json(JSON.stringify(response));
            return;
        }

        const result = await ekycService.processEkyc(metaInfo, merchantUserId);
        console.log("saveTransactionUserMapping ", result.transactionId, merchantUserId);
        dbService.saveTransactionUserMapping(result.transactionId, merchantUserId);
        const response = {
            code: EKYCResponseType.SUCCESS,
            data: result
        }
        res.json(JSON.stringify(response));
    }
    catch (e) {
        console.log("ekyc request error, error is", e);
        return res.status(500).json("Server error");
    }
});

router.post('/user/ekyc/faceverify', async (req, res) => {
    let faceverifyBody = req.body;

    if (!faceverifyBody) {
        return res.json({ code: 403, message: 'Missing metaInfo' });
    }

    try {
        const faceVerifyBodyObj = JSON.parse(faceverifyBody);
        const facePictureBase64 = faceVerifyBodyObj.facePictureBase64;
        const facePictureUrl = faceVerifyBodyObj.facePictureUrl;
        const metaInfo = faceVerifyBodyObj.metaInfo;
        const response = await ekycService.processFaceVerify(metaInfo, facePictureBase64, facePictureUrl);
        res.json(response);
    }
    catch (e) {
        return res.status(500).json("Server error");
    }
});

router.post('/user/ekyc/faceliveness', async (req, res) => {
    let metaInfo = req.body;

    if (!metaInfo) {
        return res.json({ code: 403, message: 'Missing metaInfo' });
    }

    try {
        const response = await ekycService.processFaceLiveness(metaInfo);
        res.json(response);
    }
    catch (e) {
        return res.status(500).json("Server error");
    }
});

router.post('/user/ekyc/facecompare', async (req, res) => {
    let faceCompareBody = req.body;

    if (!faceCompareBody) {
        return res.json({ code: 403, message: 'faceCompareBody metaInfo' });
    }

    try {
        const faceCompareJson = JSON.parse(faceCompareBody);

        const sourceFacePictureBase64: string = faceCompareJson.sourceFacePictureBase64;
        const sourceFacePictureUrl: string = faceCompareJson.sourceFacePictureUrl;
        const targetFacePictureBase64: string = faceCompareJson.targetFacePictureBase64;
        const targetFacePictureUrl: string = faceCompareJson.targetFacePictureUrl;

        const response = await ekycService.faceCompare(sourceFacePictureBase64, sourceFacePictureUrl, targetFacePictureBase64, targetFacePictureUrl);
        res.json(response);
    }
    catch (e) {
        return res.status(500).json("Server error");
    }
});

router.post('/user/ekyc/checkresult', async (req, res) => {
    const transactionBody = req.body;
    if (!transactionBody) {
        return res.json({ code: 403, message: 'transactionBody error' });
    }

    try {
        const transactionId: string = transactionBody.transactionId;
        const response = await ekycService.checkResult(transactionId);
        res.json(response.body);
    }
    catch (e) {
        console.error("Check error is ", e);
        return res.status(500).json("Server error");
    }
});

router.post('/user/ekyc/ekyccredential', async (req, res) => {
    const transactionBody = req.body;
    if (!transactionBody) {
        return res.json({ code: 403, message: 'transactionBody error' });
    }

    try {
        const transactionId: string = transactionBody.transactionId;
        const merchantUserId = transactionBody.merchantUserId;
        console.log("credential request params are ", transactionId, merchantUserId);
        const dbTransactionsDataOrError = await dbService.getTransactionUserMapping(transactionId);

        if (dbTransactionsDataOrError.error)
            return apiError(res, dbTransactionsDataOrError);
        const userDid = dbTransactionsDataOrError.data;
        console.log("userDid is ", userDid);

        if (merchantUserId != req.user.did || merchantUserId != userDid) {
            console.log("did don't match", merchantUserId, req.user.did, userDid);
            const response = {
                code: EKYCResponseType.DID_NOT_MATCH,
                data: ""
            }
            res.json(JSON.stringify(response));
            return;
        }

        const checkResultResponse = await ekycService.checkResult(transactionId);

        const ekycResponse: EkycResponse = checkResultResponse.body;
        const ekycRawResult: EkycRawResult = ekycResponse.result;
        const ekycResult: EKYCResult = {
            extFaceInfo: JSON.parse(ekycRawResult.extFaceInfo),
            extIdInfo: JSON.parse(ekycRawResult.extIdInfo),
            passed: ekycRawResult.passed,
            subCode: ekycRawResult.subCode
        }

        let verificationStatus: VerificationStatus = {
            // passbase: {
            //     status: PassbaseVerificationStatus.UNKNOWN
            // },
            extInfo: {
                type: ProviderType.EKYC,
                status: ProviderVerificationStatus.APPROVED
            },
            credentials: []
        };

        // Passport expiry detection
        const currentTime = Date.now();
        const expiryDate = new Date(CommonUtils.formatDate(ekycResult.extIdInfo.ocrIdInfo.expiryDate)).getTime();
        if (expiryDate < currentTime) {
            console.log("Detect passport expire");
            const response = {
                code: EKYCResponseType.PASSPORT_EXPIRE,
                data: verificationStatus
            }

            res.json(JSON.stringify(response));
            return;
        }

        //Face occlusion detection
        if (ekycResult.extFaceInfo.faceOcclusion == "Y") {
            console.log("Detect face occlusion");
            const response = {
                code: EKYCResponseType.FACE_OCCLUSION,
                data: verificationStatus
            }

            res.json(JSON.stringify(response));
            return;
        }

        let newEKYCCredentials: VerifiableCredential[] = await ekycService.generateNewUserCredentials(userDid, ekycResult);

        // FINALIZE
        // let allCredentials = [...dbCredentials, ...newPassbaseCredentials];

        // Sort by most recent first
        // allCredentials.sort((c1, c2) => c2.getIssuanceDate().valueOf() - c1.getIssuanceDate().valueOf());
        verificationStatus.credentials = newEKYCCredentials.map(c => c.toJSON());

        const response = {
            code: EKYCResponseType.SUCCESS,
            data: verificationStatus
        }

        res.json(JSON.stringify(response));
    }
    catch (e) {
        console.log("credential request error, error is ", e);
        return res.status(500).json("Server error");
    }
}

);

export default router;
