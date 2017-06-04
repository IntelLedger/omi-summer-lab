#!/bin/bash

START_DIR=`pwd`
SCRIPT_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXTERN_REPO_DIR="$SCRIPT_HOME/../dependencies/sawtooth-core"

fail() {
  msg=$1
  echo "$msg"
  exit 1
}

if [ ! -d "$EXTERN_REPO_DIR" ]; then

    mkdir -p "$EXTERN_REPO_DIR"
    cd "$EXTERN_REPO_DIR"
    git init
    git remote add -f origin https://github.com/hyperledger/sawtooth-core.git
    git config core.sparseCheckout true
    echo "sdk/javascript" >> .git/info/sparse-checkout
    echo "protos" >> .git/info/sparse-checkout

    git pull --depth=1 origin master || \
      fail 'Unable to sparse-checkout the sawtooth-sdk'

    cd "$EXTERN_REPO_DIR/sdk/javascript" || \
      fail 'Unable to properly checkout sawtooth-sdk'

    echo "Running \"npm install\" in $( pwd )"

    npm install
    npm run compile_protobuf

    cd $START_DIR

    npm i "$EXTERN_REPO_DIR/sdk/javascript/"
fi
