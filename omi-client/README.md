# OMI Summer Lab Javascript SDK

The OMI Summer Lab Javascript SDK provides a simple client to submit and fetch
values to a Hyperledger Sawtooth blockchain.

## Getting Started

**Requires Node 6.x or greater.**

In your project, install the `omi-client` using the github repository location:

```
$ npm install IntelLedger/omi-summer-lab
```

You will also need to install the underlying sawtooth-sdk  dependency, which
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
included with the omi client installation, and can be referenced in your webpack
configuration file (see `examples/webclient/webpack.config.js`).

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

Forthcoming

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


## License

[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

Copyright 2017 Intel Corporation
