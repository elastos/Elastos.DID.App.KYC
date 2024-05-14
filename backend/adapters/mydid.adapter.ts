import { DefaultDIDAdapter } from '@elastosfoundation/did-js-sdk';

export class MyDIDAdapter extends DefaultDIDAdapter {
    constructor() {
        let resolverUrl = "https://api.elastos.io/eid";
        console.log("Using elastos DID adapter with resolver url:", resolverUrl)
        super(resolverUrl);
    }
}
