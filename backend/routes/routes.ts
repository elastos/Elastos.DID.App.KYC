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
        if (existingUserDataOrError.error)
            return apiError(res, existingUserDataOrError);

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
                return apiError(res, dataOrError);
                return;
            }
        }

        let token = jwt.sign(user, SecretConfig.Auth.jwtSecret, { expiresIn: 60 * 60 * 24 * 7 });
        res.json(token);
    }
    catch (e) {
        // Possibly invalid presentation
        if (e instanceof Exceptions.MalformedPresentationException)
            return res.status(403).json("Malformed presentation");
        else
            return res.status(500).json("Server error");
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
router.get('/user/verificationstatus', async (req, res) => {
    let userDid = req.user.did;

    // Methodology to get/create new credentials:
    // - Load existing credentials from DB
    // - Check latest data from passbase for this user, in case new content appeared
    // - For each credential that seems to be missing, generate it and add it to the DB
    // - Return everything to this api
    let userDataOrError = await dbService.findUserByDID(userDid);
    if (userDataOrError.error)
        return apiError(res, userDataOrError);

    let user = userDataOrError.data!;
    if (!user) {
        res.status(403).send('User not found');
        return;
    }

    let dbCredentialsDataOrError = await dbService.getUserCredentials(userDid);
    if (dbCredentialsDataOrError.error)
        return apiError(res, dbCredentialsDataOrError);

    let verificationStatus: VerificationStatus = {
        passbase: {
            status: PassbaseVerificationStatus.UNKNOWN
        },
        credentials: []
    };

    let dbCredentials = dbCredentialsDataOrError.data!.map(c => VerifiableCredential.parse(c.vc as JSONObject));
    logger.debug("Current user credentials in DB:", dbCredentials);

    // PASSBASE
    let newPassbaseCredentials: VerifiableCredential[] = [];
    if (user.passbaseUUID) {
        newPassbaseCredentials = await passbaseService.fetchNewUserCredentials(user, dbCredentials);
        if (newPassbaseCredentials.length > 0) {
            // Add new passbase credentials to DB
            await dbService.saveCredentials(userDid, newPassbaseCredentials);
        }
    }
    verificationStatus.passbase.status = user.passbaseVerificationStatus || PassbaseVerificationStatus.UNKNOWN;

    // FINALIZE
    let allCredentials = [...dbCredentials, ...newPassbaseCredentials];

    // Sort by most recent first
    allCredentials.sort((c1, c2) => c2.getIssuanceDate().valueOf() - c1.getIssuanceDate().valueOf());

    verificationStatus.credentials = allCredentials.map(c => c.toJSON());

    res.json(verificationStatus);
});

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

export default router;
