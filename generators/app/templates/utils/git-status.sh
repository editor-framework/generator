#!/bin/bash
export ORIGINAL_PATH=`pwd`

for name in packages/* *
do
  if [ -d "${name}/.git" ]; then
    cd ${name}
    branch=$(git symbolic-ref --short -q HEAD)

    echo ------------------------------------------
    echo '\033[0;35m'${name}'\033[0m' - ${branch}
    echo ------------------------------------------

    # git status -s -b
    git status -s
    git cherry -v

    cd ${ORIGINAL_PATH}
    echo
  fi
done
