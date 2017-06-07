***************
Getting Started
***************

This guide will help you get started with Hyperledger Sawtooth and the OMI
Summer Lab Transaction Processor.

Getting the Source
******************

OMI Summer Lab is made available via the source repository.  This repository is
hosted on `Github <https://github.com/IntelLedger/omi-summer-lab>`__.

You will need to have `git` installed on your system. If you need help setting
this up, you'll find a handy guide `here
<https://help.github.com/articles/set-up-git/>`__.

.. note::

  On Mac OS, `git` is already installed, but if you haven't used it, you may
  need to run, in the terminal:

  .. code-block:: console

    $ xcode-select --install

To clone the repository:

.. code-block:: console

  $ git clone https://github.com/IntelLedger/omi-summer-lab
  Cloning into 'omi-summer-lab'...
  remote: Counting objects: 403, done.
  remote: Compressing objects: 99% (153/153), done.
  remote: Total 403 (delta 66), reused 199 (delta 59), pack-reused 186
  Receiving objects: 99% (404/404), 1.93 MiB | 952.00 KiB/s, done.
  Resolving deltas: 99% (124/124), done.


You'll find the Transaction Processor source in `omi-summer-lab/omi` and the
JavaScript client library source in `omi-summer-lab/omi-client`.

Using Docker Compose
********************

Docker is an open-source project for running applications in a software
container.  We provide several docker containers for running the various
components of Hyperledger sawtooth, as well as the OMI Summer Lab Transaction
Processor. All of these containers can be started in concert by using Docker
Compose.

Required Tools
==============

The following tools are required:

* `Docker Engine <https://docs.docker.com/engine/installation/>`_ (17.03.0-ce
  or later)
* `Docker Compose <https://docs.docker.com/compose/install/>`_ (Linux only)

Starting Up Hyperledger Sawtooth
================================

To start a validator node running the OMI transaction handler, run:

.. code-block:: console

  % docker-compose -f omi-summer-lab/docker/compose-with-omi.yaml up

This will start a validator, a config transaction handler, an OMI transaction
handler, and a REST API instance with which a client can communicate. To stop
the validator node, press Ctrl-c and then run:

.. code-block:: console

  % docker-compose -f omi-summer-lab/docker/compose-with-omi.yaml down
