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
 * @module omi-summer-lab/protobuf
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
   * @kind class
   * @extendsMessage
   */
  IndividualIdentity: _root.lookup('IndividualIdentity'),

  /**
   * This is a Protobuf Message for OrganizationalIdentity.
   *
   * @kind class
   * @extendsMessage
   */
  OrganizationalIdentity: _root.lookup('OrganizationalIdentity'),

  /**
   * This is a Protobuf Message for Recording.
   *
   * @kind class
   * @extendsMessage
   */
  Recording: _root.lookup('Recording'),

  /**
   * This is a Protobuf Message for Work.
   *
   * @kind class
   * @extendsMessage
   */
  Work: _root.lookup('Work'),

  /**
   * This is a ProtobufMessage for the OMITransactionPayload.
   *
   * @kind class
   * @extendsMessage
   */
  OMITransactionPayload: _root.lookup('OMITransactionPayload')
}
