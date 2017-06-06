# OMI Summer Lab JavaScript SDK

The OMI Summer Lab JavaScript SDK provides a simple client to submit and fetch
values to a Hyperledger Sawtooth blockchain.

## Getting Started

**Requires Node 6.x or greater.**

In your project, install the `omi-client` using the github repository location:

```
$ npm install IntelLedger/omi-summer-lab
```

> Note, some of the underlying packages are built with
> [prebuild](https://github.com/mafintosh/prebuild).  Installs will be much
> faster if you install
> [prebuild-install](https://github.com/mafintosh/prebuild-install).

You will also need to install the underlying sawtooth-sdk dependency, which
will have been included as part of the omi-summer-lab installation. Run the
following step:

```
$ npm install
./node_modules/omi-client/omi-client/dependencies/sawtooth-core/sdk/javascript
```

This can be added to your `package.json` as a `postinstall` step, for future
installations.

### Webpack configuration

If you are using a tool like Webpack, you will need to include an alias for the
zeromq library, which cannot be included in the browser. A mock module has been
included with the `omi-client` installation, and can be referenced in your
webpack configuration file (see `examples/webclient/webpack.config.js`).

A `webpack.config.js` should include the following:

```
  // ...
  resolve: {
    alias: {
      zeromq$: path.resolve(__dirname, './node_modules/omi-client/omi-client/lib/mock_zeromq.js')
    }
  }
  // ...
```

## Usage

To submit items to the block chain, or read existing items value off the global
state, you must create an `OmiClient`.  It can be created with a private key you
can generate, or one that has been saved to disk.

```
let {OmiClient} = require('omi-client')
let {signer} = require('sawtooth-sdk')

const sawtoothBaseUrl = 'http://localhost:8080'
const privateKey = signer.makePrivateKey() // or load existing key from some other source

let client = new OmiClient(sawtoothBaseUrl, privateKey)
```

### Setting Objects

Objects are set in the global state via a transaction submitted to the block
chain. These objects are `IndividualIdentity`, `OrganizationalIdentity`,
`Recording`, and `Work`. Each has a corresponding `set` method on the
`OmiClient`: `setIndividual` for `IndividualIdentity`, and so on.

Initial sets of an object result in a new object being stored in the global
state.  Subsequent sets of an object result in an update operation.  These
updates may only be performed by the owner of the private key that signed the
original set operation.  In other words, ownership of the object is controlled
by the public key associated with the private key used to create it.

`OrganizationalIdentity` and `Recordings` both have type enumerations.  These
can be accessed via

```
let {OrganizationalIdentity, Recording} = require('omi-client/protobuf')

// and used like so (with an Organization example):

client.setOrganization({
  name: 'Sawtooth Music Group',
  type: OrganizationalIdentity.Type.LABEL
}).then((statusChecker) => {
  // ...
})
```

#### Checking Commit Status

As seen in the above example, any `set` method returns a JavaScript Promise for
the current status of the transaction submission.  A call to its `check` method
will request the status, returning either `"COMMITTED"` or `"PENDING"`, in the
case of a time out.

For example:

```
client.setIndividual({ /* some fields */ })
      .then((statusChecker) => status.check())
      .then((status) => {
        if (status == 'COMMITTED') {
          // update a UI or log a message
        } else {
          // Pending - check again, or consider the transaction a failure
        }
      })
```

### Reading Objects

Objects in the global state each have a pair of methods for reading values: a
get-by-id method and a get-list method.  Like set, there is one for each OMI
Object: `getIndividual` for a single `IndividualIdentity`, and `getIndividuals`
for a cursor into a list of `IndividualIdentity`.  `OrganizationalIdentity`,
`Recording`, and `Work` follow suit.

To get all individuals, for example:

```
client.getIndividuals().all().then((individuals) => {
   // print or update a UI of individuals
})
```

To iterator over the individuals, for example:

```
client.getIndividuals().each((err, individual) => {
  if (err) {
     console.log('Error occurred reading an individual', err)
  }

  // print or update a UI individual. E.g.
  console.log(`Individual ${individual.name}`)
})
```

An specific individual can be fetched by its natural key, in this case name:

```
client.getIndividual('David Bowie').then((individual) => {
   console.log(individual.ISNI)
})
```

## Development

Checkout the repo and cd to `<omi-summer-lab>/` and type:

```
$ npm install
$ npm run compile-protobuf
```

To run the unit tests:

```
$ npm test
```

To build the docs:

```
$ npm run build-docs
```

The generated docs can be found in `<omi-summer-lab>/omi-client/docs`.



## License

[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

Copyright 2017 Intel Corporation
