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
import logging

from google.protobuf.message import DecodeError

from sawtooth_sdk.processor.state import StateEntry
from sawtooth_sdk.processor.exceptions import InvalidTransaction
from sawtooth_sdk.processor.exceptions import InternalError
from sawtooth_sdk.protobuf.transaction_pb2 import TransactionHeader

from sawtooth_omi.protobuf.work_pb2 import Work
from sawtooth_omi.protobuf.recording_pb2 import Recording
from sawtooth_omi.protobuf.identity_pb2 import IndividualIdentity
from sawtooth_omi.protobuf.identity_pb2 import OrganizationalIdentity
from sawtooth_omi.protobuf.txn_payload_pb2 import OMITransactionPayload


LOGGER = logging.getLogger(__name__)


# tags

WORK = '__work'
RECORDING = '__recording'
INDIVIDUAL = '__individual'
ORGANIZATION = '__organization'


def get_tag(action):
    work_actions = 'SetWork',
    recording_actions = 'SetRecording',
    individual_actions = 'SetIndividualIdentity',
    organization_actions = 'SetOrganizationalIdentity',

    tags = {
        work_actions: WORK,
        recording_actions: RECORDING,
        individual_actions: INDIVIDUAL,
        organization_actions: ORGANIZATION,
    }

    for action_group in tags:
        if action in action_group:
            return tags[action_group]


# address
def _hash_name(name):
    return hashlib.sha512(name.encode('utf-8')).hexdigest()


FAMILY_NAME = 'OMI'
OMI_ADDRESS_PREFIX = _hash_name(FAMILY_NAME)[:6]


def _get_address_infix(tag):
    infixes = {
        WORK: 'a0',
        RECORDING: 'a1',
        INDIVIDUAL: '00',
        ORGANIZATION: '01',
    }

    return infixes[tag]


def _get_unique_key(obj, tag):
    if not obj:
        return None

    if tag in (WORK, RECORDING):
        key = obj.title
    elif tag in (INDIVIDUAL, ORGANIZATION):
        key = obj.name

    return key


def make_omi_address(name, tag):
    infix = _get_address_infix(tag)

    return OMI_ADDRESS_PREFIX + infix + _hash_name(name)[-62:]


class OMITransactionHandler:
    @property
    def family_name(self):
        return FAMILY_NAME

    @property
    def family_versions(self):
        return ['1.0']

    @property
    def encodings(self):
        return ['application/protobuf']

    @property
    def namespaces(self):
        return [OMI_ADDRESS_PREFIX]

    def apply(self, transaction, state):
        action, txn_obj, signer = _unpack_transaction(transaction)

        tag = get_tag(action)

        # Check that the object's public key matches the submitter's
        _check_txn_object_key(txn_obj, tag, signer)

        txn_obj_name = _get_unique_key(txn_obj, tag)

        state_obj = _get_state_object(state, txn_obj_name, tag)

        # Check if the submitter is authorized to make changes,
        # then validate the transaction
        _check_state_object_authorization(state_obj, tag, signer)
        _check_split_sums(txn_obj, tag)
        _check_references(state, txn_obj, tag)

        _set_state_object(state, txn_obj, tag)


# objects

def get_object_type(tag):
    obj_types = {
        WORK: Work,
        RECORDING: Recording,
        INDIVIDUAL: IndividualIdentity,
        ORGANIZATION: OrganizationalIdentity,
    }

    return obj_types[tag]


def _parse_object(obj_string, tag):
    obj_type = get_object_type(tag)

    try:
        parsed_obj = obj_type()
        parsed_obj.ParseFromString(obj_string)
        return parsed_obj
    except DecodeError:
        raise InvalidTransaction('Invalid action')


# transaction

def _unpack_transaction(transaction):
    '''
    return action, obj, signer
    '''
    header = TransactionHeader()
    header.ParseFromString(transaction.header)
    signer = header.signer_pubkey

    payload = OMITransactionPayload()
    payload.ParseFromString(transaction.payload)

    action = payload.action
    txn_obj = payload.data

    tag = get_tag(action)

    obj = _parse_object(txn_obj, tag)

    return action, obj, signer


def _check_txn_object_key(txn_obj, tag, signer):
    _check_key(
        txn_obj, tag, signer,
        "Transaction object's key doesn't match signer's key")


def _check_state_object_authorization(state_obj, tag, signer):
    _check_key(
        state_obj, tag, signer,
        'Submitter isn\'t authorized to make changes to "{}"'.format(
            _get_unique_key(state_obj, tag)))


def _check_key(obj, tag, signer, message):
    if not obj:
        return

    if tag in (WORK, RECORDING):
        pubkey = obj.registering_pubkey
    elif tag in (INDIVIDUAL, ORGANIZATION):
        pubkey = obj.pubkey

    if pubkey != signer:
        raise InvalidTransaction(message)


def _check_split_sums(obj, tag):
    '''
    Raise InvalidTransaction if there are nonempty splits
    that don't add up to 100
    '''
    if tag == WORK:
        sp_split_sum = sum([
            sp_split.split
            for sp_split in obj.songwriter_publisher_splits
        ])

        if sp_split_sum != 100:
            raise InvalidTransaction(
                'Songwriter-publisher split for "{t}" adds up to {s}'.format(
                    t=obj.title,
                    s=sp_split_sum))

    elif tag == RECORDING:
        # check overall split
        overall = obj.overall_split

        overall_sum = sum([
            overall.derived_work_portion,
            overall.derived_recording_portion,
            overall.contributor_portion])

        if overall_sum != 100:
            raise InvalidTransaction(
                'Overall split for {t} adds up to {s}'.format(
                    t=obj.title,
                    s=overall_sum))

        # check contributor split
        contributor_splits = [
            contributor_split.split
            for contributor_split in obj.contributor_splits
        ]

        csp_sum = sum(contributor_splits)

        if csp_sum != 100:
            raise InvalidTransaction(
                'Contributor split for {t} adds up to {s}'.format(
                    t=obj.title,
                    s=csp_sum))

        # check derived work split
        derived_work_splits = [
            derived_work_split.split
            for derived_work_split in obj.derived_work_splits
        ]

        dwsp_sum = sum(derived_work_splits)

        if dwsp_sum != 100:
            raise InvalidTransaction(
                'Derived work split for {t} adds up to {s}'.format(
                    t=obj.title,
                    s=dwsp_sum))

        # check derived recording split
        derived_recording_splits = [
            derived_recording_split.split
            for derived_recording_split in obj.derived_work_splits
        ]

        drsp_sum = sum(derived_recording_splits)

        if drsp_sum != 100:
            raise InvalidTransaction(
                'Derived recording split for {t} adds up to {s}'.format(
                    t=obj.title,
                    s=drsp_sum))


def _check_references(state, obj, tag):
    '''
    Raise InvalidTransaction if the object references anything
    that isn't in state, eg if a Work refers to a songwriter
    (IndividualIdentity) or a publisher (OrganizationalIdentity)
    that hasn't been registered
    '''
    if tag == WORK:
        for sp_split in obj.songwriter_publisher_splits:
            songwriter_publisher = sp_split.songwriter_publisher

            songwriter = songwriter_publisher.songwriter_name
            if _get_state_object(state, songwriter, INDIVIDUAL) is None:
                raise InvalidTransaction(
                    'Work "{t}" references unknown songwriter "{s}"'.format(
                        t=obj.title,
                        s=songwriter))

            publisher = songwriter_publisher.publisher_name
            if _get_state_object(state, publisher, ORGANIZATION) is None:
                raise InvalidTransaction(
                    'Work "{t}" references unknown publisher "{p}"'.format(
                        t=obj.title,
                        p=publisher))

    elif tag == RECORDING:
        # check contributors
        for contributor_split in obj.contributor_splits:
            contributor = contributor_split.contributor_name
            if _get_state_object(state, contributor, INDIVIDUAL) is None:
                raise InvalidTransaction(
                    'Recording "{t}" references unknown contributor '
                    '"{c}"'.format(t=obj.title, c=contributor))

        # check derived works
        for derived_work_split in obj.derived_work_splits:
            work = derived_work_split.work_name
            if _get_state_object(state, work, WORK) is None:
                raise InvalidTransaction(
                    'Recording "{t}" references unkown work "{w}"'.format(
                        t=obj.title,
                        w=work))

        # check derived recordings
        for derived_recording_split in obj.derived_recording_splits:
            recording = derived_recording_split.recording_name
            if _get_state_object(state, recording, RECORDING) is None:
                raise InvalidTransaction(
                    'Recording "{t}" references unknown recording '
                    '"{r}"'.format(t=obj.title, r=recording))


# state
def _get_state_object(state, name, tag):
    try:
        address = make_omi_address(name, tag)
        state_entries = state.get([address])
        state_obj = state_entries[0].data
        obj = _parse_object(state_obj, tag)
    except IndexError:
        obj = None

    return obj


def _set_state_object(state, obj, tag):
    name = _get_unique_key(obj, tag)

    addresses = state.set([
        StateEntry(
            address=make_omi_address(name, tag),
            data=obj.SerializeToString())
    ])

    if not addresses:
        raise InternalError('State error')
