import { DefaultDIDAdapter } from '@elastosfoundation/did-js-sdk';

export class MyDIDAdapter extends DefaultDIDAdapter {
    constructor() {
        let resolverUrl = "https://api.trinity-tech.cn/eid";
        console.log("Using Trinity-Tech DID adapter with resolver url:", resolverUrl)
        super(resolverUrl);
    }
}
