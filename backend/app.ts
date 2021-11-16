import bodyParser from "body-parser";
import cors from "cors";
import debug from "debug";
import express from "express";
import { readFileSync } from "fs";
import http from "http";
import https from "https";
import logger from "morgan";
import { AddressInfo } from "net";
import { SecretConfig } from "./config/env-secret";
import traceLogger from "./logger";
import { authMiddleware } from "./middlewares/auth.middleware";
import router from "./routes/routes";
import { didService } from "./services/did.service";
import { passbaseService } from "./services/passbase.service";

class KYCApp {
    public async start() {
        let app = express();

        app.use(cors());
        app.use(bodyParser.json({ limit: '5mb' }));
        app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
        app.use(logger('dev'));
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(express.static('public')); // Temporary to store icons for displayable credentials - can be removed later

        app.use(authMiddleware)
        app.use('/api/v1', router);

        // Setup DID
        await didService.setup();

        // Setup Passbase
        passbaseService.setup();

        let dbg = debug('kyc-service:server');

        let port = SecretConfig.Express.port;
        app.set('port', port);

        let server: http.Server;
        if (!SecretConfig.Express.httpsMode) {
            traceLogger.info("Creating HTTP server");
            server = http.createServer(app);
        }
        else {
            traceLogger.info("Creating HTTPS server");

            var privateKey = readFileSync('dev-certificate-key.pem');
            var certificate = readFileSync('dev-certificate.pem');

            server = https.createServer({
                key: privateKey,
                cert: certificate
            }, app);
        }

        server.listen(port, '0.0.0.0');

        server.on('error', (error) => {
            /* if (error.syscall !== 'listen') {
                throw error;
            } */

            let bind = typeof port === 'string'
                ? 'Pipe ' + port
                : 'Port ' + port;

            // handle specific listen errors with friendly messages
            switch (error.name) {
                case 'EACCES':
                    throw new Error(bind + ' requires elevated privileges');
                case 'EADDRINUSE':
                    throw new Error(bind + ' is already in use');
                default:
                    throw error;
            }
        });

        /**
         * Event listener for HTTP server "listening" event.
         */
        server.on('listening', () => {
            let addr = server.address() as AddressInfo;
            if (!addr)
                throw new Error("No server address!");

            let bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr.port;
            dbg('Listening on ' + bind);

            traceLogger.info(`========= KYC service started with ${bind} =============`);
        });
    }
}

const kycApp = new KYCApp();
void kycApp.start();



