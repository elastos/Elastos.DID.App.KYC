# KYC-me - Elastos W3C Verifiable Credentials generation service for KYC

## Introduction

## Deployment

### Back-end

- Requires a mongodb instance
- clone config/env-secret.template to config/env-secret.ts
- edit config/env-secret.ts
- npm start

Additional steps for local development:

- We need to configure an HTTPS server for express (front-end needs SSL to use wallet connect, and SSL front-end needs SSL backend).
- brew install mkcert nss
- mkcert -install
- mkcert YOUR_LOCAL_IP
- rename YOUR_LOCAL_IP*.pem to dev-certificate*.pem
- (Mac) in Keychain, find the certificate (youruser@yourmachine) and in "trust": "Always trust"
- Configure config/env-secret.ts to use the HTTPS mode
- From chrome mobile, browse one API URL and accept the security exception (https://YOUR_LOCAL_IP:3040/api/v1)

### Front-end

- create a .env file at the frontend/ root.
- Set NG_APP_API_URL to point to the back-end api url
- Set NG_APP_PASSBASE_PUBLIC_API_KEY
- npm i -D
- npm run build

### Passbase metadata key generation

Private key:

```openssl genrsa -out ~/passbase-metadata-private-key.pem 4096```

Public key:

```openssl rsa -in ~/passbase-metadata-private-key.pem -out ~/passbase-metadata-public-key.pub -pubout```
