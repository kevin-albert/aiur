#!/bin/bash

pwd

if [ "$(uname -s)" == "Darwin" ]
then
  ./scripts/mac-install.sh
  ./scripts/mac-setup-root.sh || ./scripts/mac-setup-local.sh
fi
