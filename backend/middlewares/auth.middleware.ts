import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SecretConfig } from "../config/env-secret";
import { dbService } from "../services/db.service";

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.path !== "/api/v1/login" && req.path != "/api/v1/check") {
        let token = req.headers['token'] as string;
        if (token) {
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            jwt.verify(token, SecretConfig.Auth.jwtSecret, async (error, decoded) => {
                if (error || !decoded) {
                    return res.status(403).send('Token verification failed');
                } else {
                    let dataOrError = await dbService.findUserByDID(decoded.did);
                    if (dataOrError.error) {
                        return res.status(403).send('Can not find the token');
                    }
                    else {
                        let user = dataOrError.data;
                        //console.log("debug authMiddleware user", user);
                        if (user) {
                            req.user = user;
                            next();
                        }
                        else {
                            res.status(401).send('User not found for this authentication token');
                        }
                    }
                }
            })
        } else {
            res.status(401).send('Authentication token is missing');
        }
    } else {
        next();
    }
}
