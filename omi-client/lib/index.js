/**
 * Copyright 2017 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ------------------------------------------------------------------------------
 */

/**
 * @module omi-client
 */

const request = require('superagent')

const {getObjectAddress, getTypePrefix} = require('./addressing')

const {TransactionEncoder, BatchEncoder, signer} = require('sawtooth-sdk')
const {
  IndividualIdentity,
  OrganizationalIdentity,
  Recording,
  Work,
  OMITransactionPayload
} = require('./protobuf')

/**
 * An OmiClient provides a simple interface for creating objects on an instance
 * of a Hyperledger Sawtooth blockchain, and retrieving them back from the
 * gobal state.
 *
 * Each client instance is connected to a specific Sawtooth REST API instance
 * and initialized with a secp256k1 private key, which establishes the client's
 * identity and is used for signing transactions.
 *
 * @see https://intelledger.github.io/_autogen/txn_submit_tutorial_js.html#creating-private-and-public-keys
 *
 * @since 1.0.0
 */
class OmiClient {
  /**
   * Constructs an OmiClient.
   *
   * This constructs an instance of an OmiClient
   *
   * @param {string} sawtoothRestUrl - the URL of the Sawtooth REST API; E.g.
   * http://localhost:8080, for a local instance
   * @param {string} privateKey - the secp256k1 private key to use when signing
   * transactions, in hex format
   *
   * @since 1.0.0
   */
  constructor (sawtoothRestUrl, privateKey) {
    this._sawtoothRestUrl = sawtoothRestUrl
    this._privateKey = privateKey
    this._publicKey = signer.getPublicKey(privateKey)
  }

  /**
   * Set an Individual Identity.
   *
   * A SetIndividualIdentity transaction will be submitted to the blockchain,
   * and a URL for the resulting batch status via a promise.
   *
   * The argument should be structured like so:
   *
   * ```
   * {
   *   "name": "String", // a Unique name; the natural key
   *   "IPI": "International Parties Information", // may be null
   *   "ISNI": "International Standard Name Identifier", // may be null
   *   "street_address": "street address for payments", // may be null
   * }
   * ```
   *
   * Only previously set objects using the same private key as this instance may
   * be overwritten.
   *
   * @param {object} individual - the individual identity to be set
   * @param {string} individual.name - the natural key of the individual
   * @param {string} [individual.IPI] - optional International Parties
   * Information
   * @param {string} [individual.ISNI] - optional International Standard Name
   * Identifier
   * @param {string} [individual.street_address] optional street address for
   * payments
   *
   * @returns {Promise<StatusChecker>} a promise for the result of transaction submission
   *
   * @since 1.0.0
   */
  setIndividual (individual) {
    return _submitOmiTransaction(
      this._sawtoothRestUrl,
      this._privateKey,
      'SetIndividualIdentity',
      IndividualIdentity,
      'name',
      Object.assign(individual, {pubkey: this._publicKey}))
  }

  /**
   * Fetch an IndividualIdentity from the global state, and returns the value
   * via a promise.
   *
   * The resulting object returned on the resolved promise will be structured
   * like so:
   *
   * ```
   * {
   *   "name": "String", // a Unique name; the natural key
   *   "IPI": "International Parties Information", // may be null
   *   "ISNI": "International Standard Name Identifier", // may be null
   *   "street_address": "street address for payments", // may be null
   *   "pubkey": "creators pub key in hex" // matches the signer's pubkey
   * }
   * ```
   *
   * @param {string} name - the individual's name (the natural key)
   *
   * @returns {Promise<Object>} a promise for an IndividualIdentity
   *
   * @since 1.0.0
   */
  getIndividual (name) {
    return _omiStateEntry(this._sawtoothRestUrl, IndividualIdentity, name)
  }

  /**
   * Returns a cursor for all the users.
   */
  getIndividuals () {
    return _omiStateCursor(this._sawtoothRestUrl, IndividualIdentity)
  }

  /**
   * Set Organizational Identity.
   *
   * A SetOrganizationalIdentity transaction will be submitted to the
   * blockchain, and a URL for the resulting batch status will be returned via a
   * promise.
   *
   * The argument should be structured like so:
   *
   * ```
   * {
   *   "name": "String", // a Unique name; the natural key
   *   "type": <OrganizationalIdentity.type>, // the type of the organization
   *   "IPI": "International Parties Information", // may be null
   *   "street_address": "street address for payments", // may be null
   * }
   * ```
   *
   * Only previously set objects using the same private key as this instance may
   * be overwritten.
   *
   * @param {object} organization - an organizational identity to be set
   * @param {string} organization.name - the natural key of the organization
   * @param {OrganizationalIdentity.Type} organization.type - the type of the
   * organization
   * @param {string} [organization.IPI] - International Parties Information
   * @param {string} [organization.street_address] - street address for payments
   *
   * @returns {Promise<StatusChecker>} a promise for the result of transaction submission
   *
   * @since 1.0.0
   */
  setOrganization (organization) {
    return _submitOmiTransaction(
      this._sawtoothRestUrl,
      this._privateKey,
      'SetOrganizationalIdentity',
      OrganizationalIdentity,
      'name',
      Object.assign(organization, {pubkey: this._publicKey}))
  }

  /**
   * Fetch an OrganizationalIdentity from the global state, and return the value
   * via a promise.
   *
   * The resulting object returned on the resolved promise will be structured
   * like so:
   *
   * ```
   * {
   *   "name": "String", // a Unique name; its natural key
   *   "type": OrganizationalIdentity.LABEL | OrganizationalIdentity.PUBLISHER,
   *   "IPI": "International Parties Information", // may be null
   *   "street_address": "street address for payments", // may be null
   * }
   * ```
   *
   * @param {string} name the organization's name (the natural key)
   *
   * @returns {Promise} a promise for an OrganizationalIdentity
   *
   * @since 1.0.0
   */
  getOrganization (name) {
    return _omiStateEntry(this._sawtoothRestUrl, OrganizationalIdentity, name)
  }

  getOrganizations () {
    return _omiStateCursor(this._sawtoothRestUrl, OrganizationalIdentity)
  }

  /**
   * Set a Recording.
   *
   * A SetRecording transaction will be submitted to the blockchain, and a URL
   * for the resulting batch status will be returned via a promise.
   *
   * The argument should be structured like so:
   *
   * ```
   * {
   *   "title": "String", // The title of the Recording (its natural key)
   *   "type": <an int>, // The value of which is a Recording.Type
   *   "ISRC": "International Standard Recording Code", // can be null
   *   "labelName": "Org.name of type LABEL", // can be null
   *   "contributorSplits": [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "contributorName": "An IndividualIdentity.name"
   *     },
   *     // and more
   *   ],
   *   derivedWorkSplits: [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "workName": "A Work.name"
   *     },
   *   ],
   *   derivedRecordingSplits: [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "recordingName": "A Recording.name"
   *     },
   *   ],
   *   overallSplit: {
   *      // all splits in this list must add up to 100
   *     "derivedWorkPortion": <a positive int>,
   *     "derivedRecordingPortion": <a positive int>,
   *     "contributorPortion": <a positive int>
   *   }
   * }
   * ```
   *
   * Only previously set objects using the same private key as this instance may
   * be overwritten.
   *
   * @param {object} recording - the Recording to be set; see method doc for
   * structure
   *
   * @returns {Promise<StatusChecker>} a promise for the result of transaction submission
   *
   * @since 1.0.0
   */
  setRecording (recording) {
    let references = []

    if (recording.labelName) {
      references.push(getObjectAddress(OrganizationalIdentity.name, recording.labelName))
    }

    references = references.concat((recording.contributorSplits || []).map(split => {
      return getObjectAddress(IndividualIdentity.name, split.contributorName)
    }))

    references = references.concat((recording.derivedWorkSplits || []).map(split => {
      return getObjectAddress(Work.name, split.workName)
    }))

    references = references.concat((recording.derivedRecordingSplits || []).map(split => {
      return getObjectAddress(Recording.name, split.recordingName)
    }))

    return _submitOmiTransaction(
      this._sawtoothRestUrl,
      this._privateKey,
      'SetRecording',
      Recording,
      'title',
      Object.assign(recording, {registeringPubkey: this._publicKey}),
      references
    )
  }

  /**
   * Fetch a Recording from the global state, and return the value via a
   * promise.
   *
   * The resulting object returned on the resolved promise will be structured
   * like so:
   *
   * ```
   * {
   *   "title": "String", // The title of the Recording (its natural key)
   *   "type": <an int>, // The value of which is a Recording.Type
   *   "ISRC": "International Standard Recording Code", // can be null
   *   "labelName": "Org.name of type LABEL", // can be null
   *   "contributorSplits": [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "contributorName": "An IndividualIdentity.name"
   *     },
   *     // and more
   *   ],
   *   derivedWorkSplits: [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "workName": "A Work.name"
   *     },
   *   ],
   *   derivedRecordingSplits: [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "recordingName": "A Recording.name"
   *     },
   *   ],
   *   overallSplit: {
   *      // all splits in this list must add up to 100
   *     "derivedWorkPortion": <a positive int>,
   *     "derivedRecordingPortion": <a positive int>,
   *     "contributorPortion": <a positive int>
   *   }
   * }
   * ```
   *
   * @param {string} title - the title of the recording (its natural key)
   *
   * @returns {Promise} the promise for the Recording value
   *
   * @since 1.0.0
   */
  getRecording (title) {
    return _omiStateEntry(this._sawtoothRestUrl, Recording, title)
  }

  getRecordings () {
    return _omiStateCursor(this._sawtoothRestUrl, Recording)
  }

  /**
   * Set a Work.
   *
   * A SetWork transaction will be submitted to the blockchain and a URL for the
   * resulting batch status will be returned via a promise.
   *
   * The argument should be structured like so:
   *
   * ```
   * {
   *   "title": "String", // a unique title of the work; the natural key
   *   "ISWC": "International Standard Work Code", // may be null
   *   "songwriterPublisherSplits": [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "songwriterPublisher": {
   *         "songwriterName": "IndividualIdentity.name",
   *         "publisherName": "OrganizationalIdentity.name" // must be Type.PUBLISHER
   *       }
   *     },
   *     // and more
   *   ]
   * }
   * ```
   *
   * Only previously set objects using the same private key as this instance may
   * be overwritten.
   *
   * @param {object} work - the Work to be set; see method doc for structure
   *
   * @returns {Promise<StatusChecker>} a promise for the result of transaction submission
   *
   * @since 1.0.0
   */
  setWork (work) {
    let references = []
    references = references.concat((work.songwriterPublisherSplits || []).map(split => {
      return [
        getObjectAddress(IndividualIdentity.name, split.songwriterPublisher.songwriterName),
        getObjectAddress(OrganizationalIdentity.name, split.songwriterPublisher.publisherName)
      ]
    }))
    // Flatten the array
    .reduce((acc, val) => acc.concat(val), [])

    return _submitOmiTransaction(
      this._sawtoothRestUrl,
      this._privateKey,
      'SetWork',
      Work,
      'title',
      Object.assign(work, {registeringPubkey: this._publicKey}),
      references
    )
  }

  /**
   * Fetch a Work from the global state, and return the value via a promise.
   *
   * The resulting object returned on the resolved promis will be structured
   * like so:
   *
   * ```
   * {
   *   "title": "String", // a unique title of the work; the natural key
   *   "ISWC": "International Standard Work Code", // may be null
   *   "songwriterPublisherSplits": [
   *     {
   *       // all splits in this list must add up to 100
   *       "split": <a positive int>,
   *       "songwriterPublisher": {
   *         "songwriterName": "IndividualIdentity.name",
   *         "publisherName": "OrganizationalIdentity.name" // must be Type.PUBLISHER
   *       }
   *     },
   *     // and more
   *   ]
   * }
   * ```
   *
   * @param {string} title - the title of the work (its natural key)
   *
   * @returns {Promise} the promise for the work value
   *
   * @since 1.0.0
   */
  getWork (title) {
    return _omiStateEntry(this._sawtoothRestUrl, Work, title)
  }

  getWorks () {
    return _omiStateCursor(this._sawtoothRestUrl, Work)
  }
}

/**
 * A StatusChecker object provides a function to query for the current status
 * of a submitted transaction. That is, whether or not the transaction has been
 * committed to the block chain.
 */
class StatusChecker {
  /**
   * Constructs a StatusChecker for a given batch id, with a url for querying the
   * current status.
   *
   * @param {string} batchId - the batchId
   * @param {string} statusUrl - the batch status url
   */
  constructor (batchId, statusUrl) {
    /**
     * @member {string}
     */
    this.batchId = batchId
    this._statusUrl = statusUrl
  }

  /**
   * Returns the batch status from a transaction submission. The status is one
   * of ['PENDING', 'COMMITTED', 'INVALID', 'UNKNOWN'].
   *
   * The status is returned via a promise.  If a timeout occurs, the promise is
   * rejected.
   *
   * @param {number} [timeout=300000] - a timeout in millis, defaults to 5
   * minutes
   *
   * @returns {Promise<string>} the status
   */
  check (timeout = 300000) {
    return Promise.race([
      _promiseGet(`${this._statusUrl}&wait=${timeout / 1000}`).then((body) => body.data[this.batchId]),
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Timeout occurred')), timeout)
      })
    ])
  }
}
/**
 * A cursor provides a way to traverse through the objects stored in global
 * state.  Generally, this should not be created, but are returned from the
 * various plural `get` methods.
 *
 * @see {@link OmiClient.getIndividuals}
 * @see {@link OmiClient.getOrganizations}
 * @see {@link OmiClient.getWorks}
 * @see {@link OmiClient.getRecordings}
 */
class Cursor {
  /**
   * Constructs a cursor for a given sawtooth endpoint that supports the paging
   * response semantic.
   *
   * @param {string} endpoint - the query endpoint
   * @param {Cursor~xform} [xform] - an optional transform; defaults to
   * identity
   */
  constructor (endpoint, xform = (x) => x) {
    this._initialEndpoint = endpoint
    this._dataXform = xform

    this._data_buffer = []
  }
  /**
   * A transform converts a raw state value, which consists of an * address and
   * base64-encoded byte field.
   *
   * @callback Cursor~xform
   * @param {object} entry - raw json body of a state entry
   * @param {string} entry.address - the address of the value in the Global
   * State
   * @param {string} entry.data - the base64-ecoded binary data stored in the
   * GlobalState
   * @returns {object} the transformed value
   */

  /**
   * Lazily iterate over the results one element at a time.
   *
   * @param {Cursor~eachCallback} f - called on each element
   * @param {Cursor~onFinishedCallback} [onFinishedCallback] - optional
   * callback, called when the iteration is complete
   */
  each (f, onFinishedCallback = () => null) {
    let __doFetch = (url) =>
      _promiseGet(url, null).then((body) => {
        body.data.map((x) => {
          try {
            return [null, this._dataXform(x)]
          } catch (e) {
            return [e, null]
          }
        })
        .forEach(([err, value]) => f(err, value))

        let nextPage = body.paging.next
        if (nextPage) {
          return __doFetch(nextPage)
        } else {
          try {
            onFinishedCallback()
          } catch (e) {
            // this should be logged
            console.log(e)
          }
        }
      })

    __doFetch(this._initialEndpoint)
  }

  /**
   * Called on each iteration through the cursor.
   *
   * @callback Cursor~eachCallback
   * @param {string|Error} err - a possible error value on the iteration, may be
   * null
   * @param {object} entry - the value of the iteration, after passing through the
   * cursor's transform function
   */

  /**
   * Called when the `each` iteration has completed.
   * @callback Cursor~onFinishedCallback
   */

  /**
   * Take up to the first n elements from the cursor.
   *
   * @param {number} n - the number of elements to take
   *
   * @returns {Promise<T[]>}
   */
  take (n) {
    let __doFetch = (url, accumulator) =>
      _promiseGet(url, null).then((body) => {
        let data = body.data.map(this._dataXform)
        let nextPage = body.paging.next
        let nextAccumulator = accumulator.concat(data)
        let complete = nextAccumulator.length > n
        if (!complete && nextPage) {
          return __doFetch(nextPage, nextAccumulator)
        } else {
          return nextAccumulator.slice(0, n)
        }
      })

    return __doFetch(this._initialEndpoint, [])
  }

  /**
   * Returns all the elements in the cursor
   *
   * @returns {Promise<T[]>} - promise for the array of elements from the cursor
   */
  all () {
    let __doFetch = (url, accumulator) =>
      _promiseGet(url, null).then((body) => {
        let data = body.data.map(this._dataXform)
        let nextPage = body.paging.next
        let nextAccumulator = accumulator.concat(data)
        if (nextPage) {
          return __doFetch(nextPage, nextAccumulator)
        } else {
          return nextAccumulator
        }
      })

    return __doFetch(this._initialEndpoint, [])
  }
}

/**
 * @private
 */
const _promiseAgentResponse = (resolve, reject) => (err, res) => {
  if (err) {
    if (res && res.body) {
      reject(res.body)
    } else {
      reject(err)
    }
    return
  }

  if (res.status >= 200 || res.status < 300) {
    resolve(res.body)
    return
  }

  reject(new Error(`Request failed: ${res.status}`))
}

/**
 * @private
 */
const _promiseGet = (url, query) =>
  new Promise((resolve, reject) => {
    let pageRequest = request.get(url)
    if (query) {
      pageRequest = pageRequest.query(query)
    }

    pageRequest.end(_promiseAgentResponse(resolve, reject))
  })

/**
 * @private
 */
const _promisePost = (url, data) =>
  new Promise((resolve, reject) => {
    request.post(url)
           .set('Content-Type', 'application/octet-stream')
           .send(data)
           .end(_promiseAgentResponse(resolve, reject))
  })

/**
 * @private
 */
const _omiStateXform = (messageType) => (entry) => {
  let bytes = Buffer.from(entry.data, 'base64')
  let omiObject = messageType.decode(bytes)
  return messageType.toObject(omiObject)
}

/**
 * @private
 */
const _omiStateEntry = (baseUrl, messageType, naturalKey) =>
    _promiseGet(`${baseUrl}/state/${getObjectAddress(messageType.name, naturalKey)}`)
      .then(_omiStateXform(messageType))

/**
 * @private
 */
const _omiStateCursor = (baseUrl, messageType) =>
  new Cursor(`${baseUrl}/state?address=${getTypePrefix(messageType.name)}`,
             _omiStateXform(messageType))

/**
 * @private
 */
const _submitOmiTransaction = (baseUrl, privateKey, action, messageType, naturalKeyField, omiObj, additionalInputs = []) => {
  let err = messageType.verify(omiObj)
  if (err) {
    return Promise.reject(new Error(err))
  }

  const encoder = new TransactionEncoder(privateKey, {
    familyName: 'OMI',
    familyVersion: '1.0',
    payloadEncoding: 'application/protobuf',
    payloadEncoder: (payload) => OMITransactionPayload.encode(payload).finish()
  })
  const batcher = new BatchEncoder(privateKey)

  let address = getObjectAddress(messageType.name,
                                 omiObj[naturalKeyField])

  let data = messageType.encode(messageType.fromObject(omiObj)).finish()

  let payload = OMITransactionPayload.fromObject({
    action,
    data
  })

  let batch = batcher.create([encoder.create(payload, {
    inputs: [address].concat(additionalInputs),
    outputs: [address]
  })])

  let batchId = batch.headerSignature

  return _promisePost(`${baseUrl}/batches`, batcher.encode(batch))
    .then((body) => new StatusChecker(batchId, body.link))
}

module.exports = {
  OmiClient,
  Cursor,
  StatusChecker,
  IndividualIdentity,
  OrganizationalIdentity,
  Recording,
  Work
}
