# Passbase howto

## Metadata usage

Passbase can let the client side send some encrypted metadata to their API in order to associate a user with their own user UUID. We encrypt such metadata on our server, using a methodology provided by Passbase on their documentation (here)[https://docs.passbase.com/server/metadata-encryption].

Here is a summary:

- Generate the private and public keys

```
openssl genrsa -out config/passbase/passbase-metadata-private-key.pem 4096

openssl rsa -in config/passbase/passbase-metadata-private-key.pem -out config/passbase/passbase-metadata-public-key.pub -pubout
```

- Add the public key to passbase dashboard

- Then, our backend use those keys to encrypt the metadata.