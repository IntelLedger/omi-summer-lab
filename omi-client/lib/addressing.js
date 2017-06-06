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
 * @module omi-client/addressing
 */
const _crypto = require('crypto')

const _hash = (algo, str) => _crypto.createHash(algo)
                                    .update(str, 'utf8')
                                    .digest('hex')

const _sha512 = (str) => _hash('sha512', str)

const NAMESPACE = _sha512('OMI').substring(0, 6)

const TYPE_SPACE = {
  'IndividualIdentity': '00',
  'OrganizationalIdentity': '01',
  'Work': 'a0',
  'Recording': 'a1'
}
Object.seal(TYPE_SPACE)

const ADDRESS_HASH_LENGTH = 62

function getObjectAddress (type, naturalKey) {
  if (!TYPE_SPACE[type]) {
    throw new Error(`Invalid type "${type}"`)
  }
  return NAMESPACE + TYPE_SPACE[type] + _sha512(naturalKey).slice(-ADDRESS_HASH_LENGTH)
}

function getTypePrefix (type) {
  if (!TYPE_SPACE[type]) {
    throw new Error(`Invalid type "${type}"`)
  }
  return NAMESPACE + TYPE_SPACE[type]
}

module.exports = {
  /**
   * Produces an address of an object.
   *
   * An OMI object is addressed by its type and natural key. The resulting address is
   * a 70-byte value, in hex.
   *
   * @param {string} type - the object type
   * @param {string} naturalKey - the object's natural key
   * @returns {string} the address for the global state
   */
  getObjectAddress,

  /**
   * Produces an address filter for a type of objects.
   *
   * Subparts of the Global State can be queried by a address prefixes.  This
   * produces the address prefix for given OMI type.
   *
   * @param {string} type = the object type
   * @returns {string} the address prefix for objects of the given type
   */
  getTypePrefix
}
