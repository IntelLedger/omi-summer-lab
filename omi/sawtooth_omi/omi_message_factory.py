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
# -----------------------------------------------------------------------------

import hashlib

from sawtooth_processor_test.message_factory import MessageFactory

from sawtooth_omi.handler import FAMILY_NAME
from sawtooth_omi.handler import OMI_ADDRESS_PREFIX
from sawtooth_omi.handler import make_omi_address
from sawtooth_omi.protobuf.work_pb2 import Work
from sawtooth_omi.protobuf.recording_pb2 import Recording
from sawtooth_omi.protobuf.identity_pb2 import IndividualIdentity
from sawtooth_omi.protobuf.identity_pb2 import OrganizationalIdentity
from sawtooth_omi.protobuf.txn_payload_pb2 import OMITransactionPayload


# actions

WORK = 'SetWork'
RECORDING = 'SetRecording'
INDIVIDUAL = 'SetIndividualIdentity'
ORGANIZATION = 'SetOrganizationalIdentity'


class OMIMessageFactory:
    def __init__(self, private=None, public=None):
        self._factory = MessageFactory(
            encoding='application/protobuf',
            family_name=FAMILY_NAME,
            family_version='1.0',
            namespace=OMI_ADDRESS_PREFIX,
            private=private,
            public=public)

        self.public_key = self._factory.get_public_key()

    def create_batch(self, action, **kwargs):
        return self._factory.create_batch([
            self.create_transaction(action, **kwargs)])

    def create_transaction(self, action, **kwargs):
        obj_type = _get_object_type(action)

        obj = obj_type(**kwargs)

        payload = OMITransactionPayload(
            action=action,
            data=obj.SerializeToString()).SerializeToString()

        if action in (INDIVIDUAL, ORGANIZATION):
            name = kwargs['name']
        elif action in (WORK, RECORDING):
            name = kwargs['title']

        obj_address = make_omi_address(name, action)

        if action in (INDIVIDUAL, ORGANIZATION):
            inputs = [obj_address]
        elif action in (WORK, RECORDING):
            inputs = [obj_address] + _reference_addresses(action, **kwargs)

        return self._factory.create_transaction(
            payload, inputs, [obj_address], [])


def _reference_addresses(action, **kwargs):
    if action == WORK:
        splits = kwargs['songwriter_publisher_splits']
        
        songwriter_publishers = [
            split['songwriter_publisher']
            for split in splits
        ]

        songwriter_addresses = [
            make_omi_address(song_pub['songwriter_name'], INDIVIDUAL)
            for song_pub in songwriter_publishers
        ]

        publisher_addresses = [
            make_omi_address(song_pub['publisher_name'], ORGANIZATION)
            for song_pub in songwriter_publishers
        ]

        return songwriter_addresses + publisher_addresses

    elif action == RECORDING:
        contributor_addresses = [
            make_omi_address(split['contributor_name'], INDIVIDUAL)
            for split in kwargs['contributor_splits']
        ]

        work_addresses = [
            make_omi_address(split['work_name'], WORK)
            for split in kwargs['derived_work_splits']
        ]

        recording_addresses = [
            make_omi_address(split['recording_name'], RECORDING)
            for split in kwargs['derived_recording_splits']
        ]

        return contributor_addresses + work_addresses + recording_addresses


def _get_object_type(action):
    actions = {
        'SetWork': Work,
        'SetRecording': Recording,
        'SetIndividualIdentity': IndividualIdentity,
        'SetOrganizationalIdentity': OrganizationalIdentity
    }

    return actions[action]
