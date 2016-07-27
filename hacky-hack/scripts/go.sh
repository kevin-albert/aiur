#!/bin/bash

if [ "$(uname -s)" == "Darwin" ]
then
  ./mac-install.sh
  ./mac-setup-root.sh || ./mac-setup-local.sh
fi
