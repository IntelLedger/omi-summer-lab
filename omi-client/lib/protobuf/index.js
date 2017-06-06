/**
 * Copyright 2017 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
 * @module omi-client/protobuf
 */

const _protobuf = require('protobufjs/light')

const _root = _protobuf.Root.fromJSON(require('./protobuf_bundle.json'))

/**
 * @external Message
 * @see {@link http://dcode.io/protobuf.js/Message.html}
 */

module.exports = {
  /**
   * This is a Protobuf Message for IndividualIdentity.
   *
   * Functionally, the properties are equivalent to:
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
   * @kind class
   * @extends Message
   */
  IndividualIdentity: _root.lookup('IndividualIdentity'),

  /**
   * This is a Protobuf Message for OrganizationalIdentity.
   *
   * Functionally, the properties are equivalent to:
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
   * @kind class
   * @extends Message
   */
  OrganizationalIdentity: _root.lookup('OrganizationalIdentity'),

  /**
   * This is a Protobuf Message for Recording.
   *
   * Functionally, the properties are equivalent to:
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
   * @kind class
   * @extends Message
   */
  Recording: _root.lookup('Recording'),

  /**
   * This is a Protobuf Message for Work.
   *
   * Functionally, the properties are equivalent to:
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
   * @kind class
   * @extends Message
   */
  Work: _root.lookup('Work'),

  /**
   * This is a ProtobufMessage for the OMITransactionPayload.
   *
   * @kind class
   * @extends Message
   */
  OMITransactionPayload: _root.lookup('OMITransactionPayload')
}
