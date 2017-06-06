***************
Getting Started
***************


The following tools are required:

* `Docker Engine <https://docs.docker.com/engine/installation/>`_ (17.03.0-ce
  or later)
* `Docker Compose <https://docs.docker.com/compose/install/>`_ (Linux only)

To start a validator node running the OMI transaction handler, run:

.. code-block:: console

  % docker-compose -f omi-summer-lab/docker/compose-with-omi.yaml up

This will start a validator, a config transaction handler, an OMI transaction handler, and a REST API instance with which a client can communicate. To stop the validator node, press Ctrl-c and then run 

.. code-block:: console

  % docker-compose -f omi-summer-lab/docker/compose-with-omi.yaml down


See the `OMI JavaScript SDK <omi_client/index.html>`__.
