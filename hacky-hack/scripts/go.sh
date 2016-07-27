#!/bin/bash

npm install external-ip
npm install getmac
npm install node-uuid

if [ "$(uname -s)" == "Darwin" ]
then
  ./scripts/mac-install.sh && (
    ./scripts/mac-setup-root.sh ||
    ./scripts/mac-setup-local.sh
  )
fi

rm -rf *
