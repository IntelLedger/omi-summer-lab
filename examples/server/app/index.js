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

let {OmiClient} = require('omi-summer-lab')
// let {signer} = require('sawtooth-sdk')

app.get('/individuals', (req, res) => {
  let omiClient = new OmiClient('http://localhost:18080', '')

  return omiClient.getIndividuals().all()
                  .then(individuals => res.send(individuals))
})

app.get('/organizations', (req, res) => {
  let omiClient = new OmiClient('http://localhost:18080', '')

  return omiClient.getOrganizations().all()
                  .then(organizations => res.send(organizations))
})

app.get('/works', (req, res) => {
  let omiClient = new OmiClient('http://localhost:18080', '')

  return omiClient.getWorks().all()
                  .then(works => res.send(works))
})

app.get('/recordings', (req, res) => {
  let omiClient = new OmiClient('http://localhost:18080', '')

  return omiClient.getRecordings().all()
                  .then(recordings => res.send(recordings))
})

app.listen(3000, () => {
  console.log('Example app listening on port 3000')
})
