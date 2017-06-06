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

const express = require('express')
const app = express()

let {OmiClient} = require('omi-client')
// let {signer} = require('sawtooth-sdk')

const BASE_SAWTOOTH_URL = 'http://localhost:8080'
// This should either be generated once per rest user, or, in the case of reads,
// is unecessary.
const PRIVATE_KEY = ''

app.get('/individuals', (req, res) => {
  let omiClient = new OmiClient(BASE_SAWTOOTH_URL, PRIVATE_KEY)

  return omiClient.getIndividuals().all()
                  .then(individuals => res.send(individuals))
})

app.get('/organizations', (req, res) => {
  let omiClient = new OmiClient(BASE_SAWTOOTH_URL, PRIVATE_KEY)

  return omiClient.getOrganizations().all()
                  .then(organizations => res.send(organizations))
})

app.get('/works', (req, res) => {
  let omiClient = new OmiClient(BASE_SAWTOOTH_URL, PRIVATE_KEY)

  return omiClient.getWorks().all()
                  .then(works => res.send(works))
})

app.get('/recordings', (req, res) => {
  let omiClient = new OmiClient(BASE_SAWTOOTH_URL, PRIVATE_KEY)

  return omiClient.getRecordings().all()
                  .then(recordings => res.send(recordings))
})

app.listen(3000, () => {
  console.log('Example app listening on port 3000')
})
