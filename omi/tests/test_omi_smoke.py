# Copyright 2017 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ------------------------------------------------------------------------------

import json
import time
import logging
import requests
import unittest

from sawtooth_omi.omi_message_factory import OMIMessageFactory
from sawtooth_omi.protobuf.work_pb2 import Work
from sawtooth_omi.protobuf.recording_pb2 import Recording
from sawtooth_omi.protobuf.identity_pb2 import IndividualIdentity
from sawtooth_omi.protobuf.identity_pb2 import OrganizationalIdentity
from sawtooth_omi.protobuf.txn_payload_pb2 import OMITransactionPayload


LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.DEBUG)


URL = 'http://rest_api:8080'

class TestOMISmoke(unittest.TestCase):
    def test_omi_smoke(self):
        tina_turner = OMIClient(URL)
        david_bowie = OMIClient(URL)

        LOGGER.info('Tina sets "Tina Turner"')
        
        tina_turner.set_individual_identity(**{
            'name': 'Tina Turner',
            'IPI': None,
            'ISNI': None,
            'street_address': None,
            'pubkey': tina_turner.public_key,
        })

        LOGGER.info('David sets "David Bowie"')
        
        david_bowie.set_individual_identity(**{
            'name': 'David Bowie',
            'IPI': '00052210040',
            'ISNI': '0000 0004 5825 7298',
            'street_address': 'New York',
            'pubkey': david_bowie.public_key,
        })

        LOGGER.info(
            'Tina tries and fails to update "David Bowie" with her own key')
        
        tina_turner.set_individual_identity(**{
            'name': 'David Bowie',
            'IPI': '00334284961',
            'ISNI': '0000 0001 2096 4892',
            'street_address': 'Minnesota',
            'pubkey': tina_turner.public_key,
        })

        LOGGER.info(
            'David tries and fails to update "Tina Turner" with Tina\'s key')

        david_bowie.set_individual_identity(**{
            'name': 'Tina Turner',
            'IPI': '00062845371',
            'ISNI': '0000 0000 6311 1489',
            'street_address': 'Philadelphia',
            'pubkey': tina_turner.public_key,
        })

        LOGGER.info('Tina updates "Tina Turner"')

        tina_turner.set_individual_identity(**{
            'name': 'Tina Turner',
            'IPI': '00061980371',
            'ISNI': '0000 0001 2028 6171',
            'street_address': 'Zurich',
            'pubkey': tina_turner.public_key,
        })

        LOGGER.info('David sets "Giorgio Moroder"')

        david_bowie.set_individual_identity(**{
            'name': 'Giorgio Moroder',
            'IPI': '00021545123',
            'ISNI': '0000 0001 0920 8834',
            'street_address': 'Munich',
            'pubkey': david_bowie.public_key
        })

        ### TODO: verify individuals ###

        LOGGER.info('Tina sets "Capitol"')

        tina_turner.set_organizational_identity(**{
            'name': 'Capitol',
            'type': 'LABEL',
            'IPI': None,
            'street_address': None,
            'pubkey': tina_turner.public_key,
        })

        LOGGER.info('David sets "EMI"')

        david_bowie.set_organizational_identity(**{
            'name': 'EMI',
            'type': 'PUBLISHER',
            'IPI': None,
            'street_address': None,
            'pubkey': david_bowie.public_key,
        })

        LOGGER.info('Tina sets "Nutbush City Limits"')

        tina_turner.set_work(**{
            'title': 'Nutbush City Limits',
            'ISWC': 'T-070.242.596-4',
            'songwriter_publisher_splits': [
                {
                    'split': 100,
                    'songwriter_publisher': {
                        'songwriter_name': 'Tina Turner',
                        'publisher_name': 'EMI',
                    }
                }
            ],
            'registering_pubkey': tina_turner.public_key,
        })

        LOGGER.info('David tries to set "Cat People" with a bad sp split')

        david_bowie.set_work(**{
            'title': 'Cat People',
            'ISWC': 'T-905.465.061-2',
            'songwriter_publisher_splits': [
                {
                    'split': 40,
                    'songwriter_publisher': {
                        'songwriter_name': 'Giorgio Moroder',
                        'publisher_name': 'EMI',
                    }
                },
                {
                    'split': 50,
                    'songwriter_publisher': {
                        'songwriter_name': 'David Bowie',
                        'publisher_name': 'EMI',
                    }
                }
            ],
            'registering_pubkey': david_bowie.public_key,
        })

        ### TODO: verify no Cat People set ###

        LOGGER.info('David gets the sp split right')

        david_bowie.set_work(**{
            'title': 'Cat People',
            'ISWC': 'T-905.465.061-2',
            'songwriter_publisher_splits': [
                {
                    'split': 40,
                    'songwriter_publisher': {
                        'songwriter_name': 'Giorgio Moroder',
                        'publisher_name': 'EMI',
                    }
                },
                {
                    'split': 60,
                    'songwriter_publisher': {
                        'songwriter_name': 'David Bowie',
                        'publisher_name': 'EMI',
                    }
                }
            ],
            'registering_pubkey': david_bowie.public_key,
        })

        ### TODO: verify Cat People ###

        LOGGER.info(
            'Tina tries to set recording "Tonight" '
            'without setting work "Tonight"')

        tina_turner.set_recording(**{
            'title': 'Tonight',
            'type': 'SONG',
            'ISRC': 'USCA28800061',
            'label_name': 'Capitol',
            'contributor_splits': [
                {
                    'split': 50,
                    'contributor_name': 'Tina Turner',
                },
                {
                    'split': 50,
                    'contributor_name': 'David Bowie',
                },
            ],
            'derived_work_splits': [
                {
                    'split': 100,
                    'work_name': 'Tonight'
                }
            ],
            'derived_recording_splits': [],
            'overall_split': {
                'contributor_portion': 70,
                'derived_work_portion': 30,
                'derived_recording_portion': 0,
            },
            'registering_pubkey': tina_turner.public_key,
        })

        LOGGER.info(
            'David tries to set work "Tonight" without setting '
            '"James Osterberg" (Iggy Pop)')

        david_bowie.set_work(**{
            'title': 'Tonight',
            'ISWC': 'T-904.228.747-8',
            'songwriter_publisher_splits': [
                {
                    'split': 50,
                    'songwriter_publisher': {
                        'songwriter_name': 'David Bowie',
                        'publisher_name': 'EMI',
                    }
                },
                {
                    'split': 50,
                    'songwriter_publisher': {
                        'songwriter_name': 'James Osterberg',
                        'publisher_name': 'EMI',
                    }
                }
            ],
            'registering_pubkey': david_bowie.public_key,
        })

        ### TODO: verify Tonight not set ###

        LOGGER.info('David sets "James Osterberg" and then sets "Tonight"')

        david_bowie.set_individual_identity(**{
            'name': 'James Osterberg',
            'IPI': '00269949887',
            'ISNI': '0000 0001 0192 1707',
            'street_address': 'Michigan',
            'pubkey': david_bowie.public_key,
        })

        david_bowie.set_work(**{
            'title': 'Tonight',
            'ISWC': 'T-070.057.144-3',
            'songwriter_publisher_splits': [
                {
                    'split': 70,
                    'songwriter_publisher': {
                        'songwriter_name': 'David Bowie',
                        'publisher_name': 'EMI',
                    }
                },
                {
                    'split': 30,
                    'songwriter_publisher': {
                        'songwriter_name': 'James Osterberg',
                        'publisher_name': 'EMI',
                    }
                }
            ],
            'registering_pubkey': david_bowie.public_key,
        })

        ### TODO: verify Tonight set ###

        LOGGER.info('Tina sets recording "Tonight"')

        tina_turner.set_recording(**{
            'title': 'Tonight',
            'type': 'SONG',
            'ISRC': 'USCA28800061',
            'label_name': 'Capitol',
            'contributor_splits': [
                {
                    'split': 50,
                    'contributor_name': 'Tina Turner',
                },
                {
                    'split': 50,
                    'contributor_name': 'David Bowie',
                },
            ],
            'derived_work_splits': [
                {
                    'split': 100,
                    'work_name': 'Tonight'
                }
            ],
            'derived_recording_splits': [],
            'overall_split': {
                'contributor_portion': 70,
                'derived_work_portion': 30,
                'derived_recording_portion': 0,
            },
            'registering_pubkey': tina_turner.public_key,
        })


class OMIClient:
    def __init__(self, url):
        self.url = url
        self.factory = OMIMessageFactory()
        self.public_key = self.factory.public_key.encode()
        self.prefix = '38aa50'

    def set_work(self, **kwargs):
        self._post_omi_txn('SetWork', **kwargs)

    def set_recording(self, **kwargs):
        self._post_omi_txn('SetRecording', **kwargs)

    def set_individual_identity(self, **kwargs):
        self._post_omi_txn('SetIndividualIdentity', **kwargs)

    def set_organizational_identity(self, **kwargs):
        self._post_omi_txn('SetOrganizationalIdentity', **kwargs)

    def _post_omi_txn(self, action, **kwargs):
        self._send_batches(
            self.factory.create_batch(
                action, **kwargs))

        time.sleep(1)

    # basic rest api stuff

    def _send_batches(self, batch_list):
        return self._post('/batches', batch_list)

    def _post(self, path, data, **queries):
        if isinstance(data, bytes):
            headers = {'Content-Type': 'application/octet-stream'}
        else:
            data = json.dumps(data).encode()
            headers = {'Content-Type': 'application/json'}
        headers['Content-Length'] = '%d' % len(data)

        code, json_result = self._submit_request(
            self.url + path,
            params=self._format_queries(queries),
            data=data,
            headers=headers,
            method='POST')

        if code == 200 or code == 201 or code == 202:
            return json_result
        else:
            raise Exception("({}): {}".format(code, json_result))

    def _submit_request(self, url, params=None, data=None,
                        headers=None, method="GET"):
        try:
            if method == 'POST':
                result = requests.post(
                    url, params=params, data=data, headers=headers)
            elif method == 'GET':
                result = requests.get(
                    url, params=params, data=data, headers=headers)
            result.raise_for_status()
            return (result.status_code, result.json())
        except requests.exceptions.HTTPError as e:
            return (e.response.status_code, e.response.reason)
        except requests.exceptions.ConnectionError as e:
            raise Exception(
                ('Unable to connect to "{}": '
                 'make sure URL is correct').format(self.url))

    @staticmethod
    def _format_queries(queries):
        queries = {k: v for k, v in queries.items() if v is not None}
        return queries if queries else ''
