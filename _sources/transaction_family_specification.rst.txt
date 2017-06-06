***********************************************
OMI Summer Lab Transaction Family Specification
***********************************************

Overview
=========
The transaction family for the Open Music Initiative Summer Lab is
intended to lay a foundation for the management of identities, musical
works, and recordings on the Sawtooth blockchain. It is expected that
Summer Lab projects will use, extend, or even replace portions of this
design in their projects and demos.

The transaction family allows users to set and update:

* Individual Identities - Songwriters, performers, DJs, etc.
* Organizational Identities - Labels, Publishers, etc.
* Musical Works - The composition of a song or piece of music.
* Musical or Video Recordings - A sound or video recording of a music
  performance or a recording derived from a number of recorded music
  performances.

An OMI Summer Lab transaction request is defined by the following values:

* A verb which describes what action the transaction takes (e.g. SetRecording)
* An object which represents the full replacement value compatible with
  the action.

For example, a 'SetRecording' transaction must contain a valid 'Recording'
object.

For simplicity, the initial OMI Summer Lab transaction family combines
'create' and 'update' semantics into a single 'set' concept. If the unique
identifier used to encode the address of the object does not exist in state,
then the signer of the transaction becomes the 'registering owner' of that
object. Any future 'set' actions against that object must be signed by the
same private key as was used to perform the first 'set'. Each tranasaction
also includes a full replace of the existing data.

The initial actions are:

* SetIndividualIdentity
* SetOrganizationalIdentity
* SetWork
* SetRecording

State
=====
The four different types of objects each have their own storage formats
in global state, defined by Google Protocol Buffers v3 schemas.

.. literalinclude:: ../../protos/identity.proto
   :language: protobuf
   :caption: File: protos/identity.proto
   :linenos:

.. literalinclude:: ../../protos/work.proto
   :language: protobuf
   :caption: File: protos/work.proto
   :linenos:

.. literalinclude:: ../../protos/recording.proto
   :language: protobuf
   :caption: File: protos/recording.proto
   :linenos:

Addressing
----------
OMI Summer Lab data is stored in state using addresses which are generated
from the OMI Summer Lab namespace prefix, the object type prefix, and the
unique key field of the object.

Addresses will adhere to the following format:

- Addresses must be a 70 character hexadecimal string
- The first 6 characters of the address are the first 6 hexdigest
  characters of a sha512 hash of the utf-8 formatted string 'OMI'
- The next 2 characters of the address are based on the object type:

  - '00' - IndividualIdentity
  - '01' - OrganizationalIdentity
  - 'a0' - Work
  - 'a1' - Recording

- The remaining 62 characters of the address are the last 62 hexdigest
  characters of a sha512 hash of the unique key field of the object.

The unique key fields are 'name' for identities and 'title' for works
and recordings.

For example, an OMI Summer Lab address for the IndividualIdentity 'David
Hasslehoff' would be generated as follows:

.. code-block:: pycon

    >>> hashlib.sha512('OMI'.encode('utf-8')).hexdigest()[0:6] + '00' + hashlib.sha512('David Hasslehoff'.encode('utf-8')).hexdigest()[-62:]
    '38aa5000c4a0ef7500c34bf14387cdae75df3c5ac3cb95f66e6dcf1f126b7f8230dce5'

Transaction Payload
===================

OMI Summer Lab transaction payloads are defined by a protobuf container
format which contains the action and an array of bytes containing
serialized versions of the protobuf definitions described above in the
State section. Since the transactions contain full replacement values,
we can reuse the formats for transaction payload definition and for
storage in state.

Transaction Header
==================

Inputs and Outputs
------------------

The inputs for OMI Summer Lab family transactions must include:

* Address of the objects being read as part of validating the
  transaction. This includes the object's address and the addresses
  of all dependent 'foreign keys'. For example, if a Work references a
  songwriter, the transaction header must include the calculated
  address of that songwriter's IndividualIdentity, because the
  transaction processor must perform a get to determine if that object
  exists.

The outputs for OMI Summer Lab family transactions must include:

* Address of the object being set.

Dependencies
------------
Based on the current 'set-only' design of the OMI Summer Lab transactions,
explicit dependencies should not be required.

Family
------
- family_name: "OMI"
- family_version: "1.0"

Encoding
--------
- payload_encoding: "application/protobuf"

Execution
=========

In order to keep the implementation simple, we have not placed a lot of
constraints on the input data. For example, we are not enforcing maximum
lengths on string types. A production use case would require tighter
controls on allowable input data.

The transaction processor does need to enforce implied 'foreign key'
relationships between objects. For example, a 'SetWork' transaction
which references a songwriter name which does not appear as an
IndividualIdentity should result in an InvalidTransaction. All implied
references of this type should be checked in the transaction handler.

The transaction handler must verify whether the pubkey fields in the
IndividualIdentity and OrganizationalIdentity and the registering_pubkey
fields in the Work and Recording object match the public key of the
Transaction.header.signer_pubkey. This ensures that the signer of the
transaction is the same as the claimed identity in the data.

If an object already exists at an address, the transaction handler must
also check to see if the public key in the existing data matches the
public key in the transaction payload. If it does not, it should result
in an InvalidTransaction.
