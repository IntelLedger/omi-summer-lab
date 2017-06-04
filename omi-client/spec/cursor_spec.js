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
const querystring = require('querystring')
const request = require('superagent')
const mock = require('superagent-mocker')(request)

const {Cursor} = require('../lib')

describe('Cursor', () => {
  beforeEach(() => {
    mock.clearRoutes()
  })

  describe('.all()', () => {
    it('should return all values of a query, with no pages', () => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: [{x: 1, y: 1}, {x: 5, y: 5}],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let cursor = new Cursor('/paging_endpoint')

      return cursor.all().then(objs => {
        assert.deepEqual([
          {x: 1, y: 1},
          {x: 5, y: 5}
        ],
        objs)
      })
    })

    it('should return all values of a query, included subsequent pages', () => {
      let data = {
        0: [ 'a', 'b', 'c' ],
        3: [ 'd', 'e', 'f' ],
        6: [ 'g' ]
      }
      mock.get('/paging_endpoint/:query', (req) => {
        // We're hacking the query, as the real URL isn't submtted
        let query = querystring.parse(req.params.query)
        let startIndex = parseInt(query.start)
        let next = startIndex < 6
          ? '/paging_endpoint/?&start=' + (startIndex + data[startIndex].length)
          : null

        return {
          body: {
            data: data[startIndex],
            paging: {
              start_index: startIndex,
              total_count: 7,
              next: next
            }
          }
        }
      })

      let cursor = new Cursor('/paging_endpoint/?&start=0')

      return cursor.all().then(strs => {
        assert.deepEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'],
                         strs)
      })
    })

    it('should apply a provided transform to the data elements', () => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: ['1,2,3', '4,5,6'],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let cursor = new Cursor('/paging_endpoint',
                              (x) => x.split(',').map(v => parseInt(v)))

      return cursor.all().then(vals => {
        assert.deepEqual([
          [1, 2, 3],
          [4, 5, 6]
        ], vals)
      })
    })

    it('should reject the promise on bad response', () => {
      mock.get('/paging_endpoint', () => ({
        status: 400,
        body: {
          error: 'This is an error message'
        }
      }))

      let cursor = new Cursor('/paging_endpoint')
      return cursor.all().catch(e => e)
        .then(err => {
          assert(!!err, 'Should have returned an error')
        })
    })

    it('should reject the promise on a bad xform', () => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: ['1,2,3', '4,5,6'],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let cursor = new Cursor('/paging_endpoint',
                              () => { throw new Error('Bad xform') })
      return cursor.all().catch(e => e)
        .then(err => {
          assert.equal('Bad xform', err.message)
        })
    })
  })

  describe('.each()', () => {
    it('should return a single value per iteration', (done) => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: [{x: 1, y: 1}, {x: 5, y: 5}],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let accumulator = []

      let cursor = new Cursor('/paging_endpoint')

      cursor.each(
        (err, value) => {
          if (err) {
            done(err)
          }
          accumulator.push(value)
        },
        () => {
          assert.deepEqual([
            {x: 1, y: 1},
            {x: 5, y: 5}
          ],
          accumulator)
          done()
        })
    })

    it('should iterate accross pages', (done) => {
      let data = {
        0: [ 'a', 'b', 'c' ],
        3: [ 'd', 'e', 'f' ],
        6: [ 'g' ]
      }
      mock.get('/paging_endpoint/:query', (req) => {
        // We're hacking the query, as the real URL isn't submtted
        let query = querystring.parse(req.params.query)
        let startIndex = parseInt(query.start)
        let next = startIndex < 6
          ? '/paging_endpoint/?&start=' + (startIndex + data[startIndex].length)
          : null

        return {
          body: {
            data: data[startIndex],
            paging: {
              start_index: startIndex,
              total_count: 7,
              next: next
            }
          }
        }
      })

      let accumulator = []
      let cursor = new Cursor('/paging_endpoint/?&start=0')
      cursor.each(
        (err, value) => {
          if (err) {
            done(err)
            return
          }

          accumulator.push(value)
        },
        () => {
          assert.deepEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'], accumulator)
          done()
        })
    })

    it('should return an error on bad transforms', (done) => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: [1, 2, 3],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let exception = null
      let accumulator = []
      let cursor = new Cursor('/paging_endpoint', (x) => {
        if (x === 2) {
          throw new Error('Thrown!')
        }
        return x
      })
      cursor.each(
        (err, value) => {
          if (err) {
            exception = err
            return
          }

          accumulator.push(value)
        },
        () => {
          assert.deepEqual([1, 3], accumulator)
          assert.equal('Thrown!', exception.message)
          done()
        })
    })
  })

  describe('.take()', () => {
    it('should take only the first n items', () => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let cursor = new Cursor('/paging_endpoint')
      return cursor.take(5).then(values => {
        assert.deepEqual([1, 2, 3, 4, 5], values)
      })
    })

    it('should take only the first n, accross pages', () => {
      let data = {
        0: [ 'a', 'b', 'c' ],
        3: [ 'd', 'e', 'f' ],
        6: [ 'g' ]
      }
      mock.get('/paging_endpoint/:query', (req) => {
        // We're hacking the query, as the real URL isn't submtted
        let query = querystring.parse(req.params.query)
        let startIndex = parseInt(query.start)
        let next = startIndex < 6
          ? '/paging_endpoint/?&start=' + (startIndex + data[startIndex].length)
          : null

        return {
          body: {
            data: data[startIndex],
            paging: {
              start_index: startIndex,
              total_count: 7,
              next: next
            }
          }
        }
      })

      let cursor = new Cursor('/paging_endpoint/?&start=0')
      return cursor.take(5).then(values => {
        assert.deepEqual(['a', 'b', 'c', 'd', 'e'], values)
      })
    })

    it('should apply a provided transform to the data elements', () => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: ['1,2,3', '4,5,6', '12,12,12', '11,11,11'],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let cursor = new Cursor('/paging_endpoint',
                              (x) => x.split(',').map(v => parseInt(v)))

      return cursor.take(2).then(vals => {
        assert.deepEqual([
          [1, 2, 3],
          [4, 5, 6]
        ], vals)
      })
    })

    it('should reject the promise on bad response', () => {
      mock.get('/paging_endpoint', () => ({
        status: 400,
        body: {
          error: 'This is an error message'
        }
      }))

      let cursor = new Cursor('/paging_endpoint')
      return cursor.take(1).catch(e => e)
        .then(err => {
          assert(!!err, 'Should have returned an error')
        })
    })

    it('should reject the promise on a bad xform', () => {
      mock.get('/paging_endpoint', (req) => ({
        body: {
          data: ['1,2,3', '4,5,6'],
          paging: {
            start_index: 0,
            total_count: 2
          }
        }
      }))

      let cursor = new Cursor('/paging_endpoint',
                              () => { throw new Error('Bad xform') })
      return cursor.take(1).catch(e => e)
        .then(err => {
          assert.equal('Bad xform', err.message)
        })
    })
  })
})
