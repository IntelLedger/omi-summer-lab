***************************************
Modifying the OMI Transaction Processor
***************************************

This guide will help you add your own changes to the OMI Summer Lab Transaction
Processor.

.. note::

  For more inforamation on Transaction Processors in Hyperledger Sawtooth,
  checkout the `Applpication Developer's Guide
  <https://intelledger.github.io/app_developers_guide.html>`__, paying close
  attention to the Python SDK section

Getting the Hyperledger Sawtooth Python SDK
*******************************************

Transaction processors may be written in a number of languages, but the OMI
Transaction Processor is implemented using the Sawtooth Python SDK.  This is
currently not available via standard Python dependency tools (e.g. `pip`), so
you'll need to checkout the Hyperledger Sawtooth repository.  Assuming you have
`git` installed from the previous section:

.. code-block:: console

  $ git clone https://github.com/hyperledger/sawtooth-core

It is recommended that you clone `sawtooth-core` into the same parent directory
of `omi-summer-lab`.

Preparing the SDK
=================

The Sawtooth Python SDK requires a bit of preparation for use with the OMI
Transaction Processor.  You will need `Python 3
<https://www.python.org/downloads/>`__ installed for all of the following
commands.  

In `sawtooth-core`, run the following command:

.. code-block:: console

  $ pip3 install grpcio-tools
  ...
  Successfully installed grpcio-1.3.5 grpcio-tools-1.3.5 protobuf-3.3.0 six-1.10.0
  $ ./bin/protogen

This last command has no output.

Add the now-ready Sawtooth Python SDK to your Python path:

.. code-block:: console

  $ export PYTHONPATH=<parent directory>/sawtooth-core/sdk/python:$PYTHONPATH

Running the Validator
=====================

As we did in the previous section we'll use `docker compose` to start up a
validator instance, a config transaction processor, and a REST API process, but
we will be starting up the OMI Transaction Processor ourselves.  We've provided
a separate compose file to start this subset of components:

.. code-block:: console

  $ docker-compose -f omi-summer-lab/docker/compose-without-omi.yaml up

To stop the validator node, press Ctrl-c and then run:

.. code-block:: console

  $ docker-compose -f omi-summer-lab/docker/compose-without-omi.yaml down

Running the OMI Transaction Processor
=====================================

With the validator started, we can move on to running our version of the OMI
Transaction Processor.

Gathering Dependencies
----------------------

We'll need a few more Python dependencies.  We've provided a `requirements.txt`
with the remaining items needed. In the `omi-summer-lab` directory, run:

.. code-block:: console

  $ pip3 install -r requirements.txt

Running the Transaction Processor
---------------------------------

We can now run the Transaction Processor. In the `omi-summer-lab` directory,
run:

.. code-block:: console

  $ ./bin/omi-tp -vv tcp://localhost:40000
  [17:21:50 DEBUG   selector_events] Using selector: ZMQSelector
  [17:21:50 INFO    core] register attempt: OK

This will start the transaction processor and connect it to the running
validator we started in the previous section. 

Making changes to the Transaction Processor
-------------------------------------------

Modifications to the Transaction Processor can be made by editing the
Transaction Handler implementation found at
`omi-summer-lab/omi/sawtooth_omi/handler.py`.  The important method to focus on
in this file is `OMITransactionHandler.apply`. This is where the operations of
validating the transaction payload and setting global state values happen.

.. note::

  See the Application Developer's Guide section on `The apply Method
  <https://intelledger.github.io/_autogen/sdk_TP_tutorial_python.html#the-apply-method>`__
  for more information.

Currently, this handler implementation writes OMI objects to the global state,
and validates ownership based on the public key associated with the enclosing
transaction.

You could, for example, build a payment record transaction for a number of
plays of a song from a streaming service. The transaction would contain the
song identifier and the number of plays and the total payment and would be
signed by the streaming service identity (e.g. “youtube” or “spotify”). The
Transaction Processor would calculate the splits based on the fractional artist
participation based on the song “tree” and would create records in state
indicating payments to artists as a result of the plays.
