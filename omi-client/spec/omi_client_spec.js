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

'use strict'

const assert = require('assert')
const request = require('superagent')
const mock = require('superagent-mocker')(request)

const {BatchList, TransactionHeader} = require('sawtooth-sdk/protobuf')

const {OmiClient} = require('../lib')
const addressing = require('../lib/addressing')
const {Recording} = require('../lib/protobuf')

// This is normally a URL, but for testing purposes, an empty string is fine
const BASE_SAWTOOTH_URL = ''
const PRIVATE_KEY = 'e8e4109d6e2d0f46984115c297090401a9fa0c2a7e9c72485739d5135cedab20'

describe('OmiClient', () => {
  beforeEach(() => {
    mock.clearRoutes()
  })

  describe('setWork', () => {
    it('should submit a txn with the correct inputs and outputs', () => {
      let data = null

      mock.post('/batches', (req) => {
        data = req.body

        return {
          body: { link: 'batchstatuslink' }
        }
      })

      let client = new OmiClient(BASE_SAWTOOTH_URL, PRIVATE_KEY)
      return client.setWork({
        title: 'TestSong',
        songwriterPublisherSplits: [
          {
            split: 100,
            songwriterPublisher: {
              songwriterName: 'TestSinger',
              publisherName: 'TestPublisher'
            }
          }
        ]
      }).then((statusChecker) => {
        let {batchId, transactionHeader} = _recoverTransaction(data)

        assert.equal(batchId, statusChecker.batchId)

        assert.deepEqual([_workAddress('TestSong')], transactionHeader.outputs)
        assert.deepEqual(
          [
            _workAddress('TestSong'),
            _individualAddress('TestSinger'),
            _orgAddress('TestPublisher')
          ],
          transactionHeader.inputs)
      })
    })
  })

  describe('setRecording', () => {
    it('should submit a txn with the correct inputs and outputs', () => {
      let data = null

      mock.post('/batches', (req) => {
        data = req.body

        return {
          body: { link: 'batchstatuslink' }
        }
      })

      let client = new OmiClient(BASE_SAWTOOTH_URL, PRIVATE_KEY)
      return client.setRecording({
        title: 'TestRecording',
        type: Recording.Type.MIX,
        labelName: 'TestLabel',
        contributorSplits: [
          {
            split: 100,
            contributorName: 'TestSinger'
          }
        ],
        derivedWorkSplits: [
          {
            split: 100,
            workName: 'TestWork'
          }
        ],
        derivedRecordingSplits: [
          {
            split: 100,
            recordingName: 'TestOtherRecording'
          }
        ],
        overallSplit: {
          derivedWorkPortion: 33,
          derivedRecordingPortion: 33,
          contributorPortion: 34
        }
      }).then((statusChecker) => {
        let {batchId, transactionHeader} = _recoverTransaction(data)

        assert.equal(batchId, statusChecker.batchId)

        assert.deepEqual([_recordingAddress('TestRecording')],
                         transactionHeader.outputs)

        assert.deepEqual(
          [
            _recordingAddress('TestRecording'),
            _orgAddress('TestLabel'),
            _individualAddress('TestSinger'),
            _workAddress('TestWork'),
            _recordingAddress('TestOtherRecording')
          ],
          transactionHeader.inputs)
      })
    })
  })
})

/**
 * There is a side-effect due to superagent-mocker that converts the data
 * to an object.  We need to take the object body and convert it back to a
 * buffer.
 */
let _bodyToBuffer = (body) => {
  let bufferLength = Object.keys(body).length
  let buffer = Buffer.alloc(bufferLength)
  for (var i = 0; i < bufferLength; i++) {
    buffer.writeUInt8(body[i], i)
  }
  return buffer
}

let _recoverTransaction = (data) => {
  let batchList = BatchList.decode(_bodyToBuffer(data))

  assert.equal(1, batchList.batches.length)
  let batch = batchList.batches[0]

  assert.equal(1, batch.transactions.length)
  let transaction = batch.transactions[0]

  let transactionHeader = TransactionHeader.decode(transaction.header)
  return {
    batchId: batch.headerSignature,
    transaction,
    transactionHeader
  }
}

let _workAddress = (title) => addressing.getObjectAddress('Work', title)
let _recordingAddress = (title) => addressing.getObjectAddress('Recording', title)
let _individualAddress = (name) => addressing.getObjectAddress('IndividualIdentity', name)
let _orgAddress = (name) => addressing.getObjectAddress('OrganizationalIdentity', name)
