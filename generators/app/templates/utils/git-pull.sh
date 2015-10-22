#!/bin/bash

export ORIGINAL_PATH=`pwd`

for name in builtin/* *
do
  if [ -d "${name}/.git" ]; then
    echo pulling ${name}
    cd ${name}
    git pull
    cd ${ORIGINAL_PATH}
    echo
  fi
done
