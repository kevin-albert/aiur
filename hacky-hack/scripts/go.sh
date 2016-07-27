#!/bin/bash

mv node_modules zealot/node_modules
cd scripts

if [ "$(uname -s)" == "Darwin" ]
then
  ./mac-install.sh
  ./mac-setup-root.sh || ./mac-setup-local.sh
fi
