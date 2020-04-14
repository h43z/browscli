#!/bin/sh
test -z "$1" || test -z "$2" && { echo missing browserId and tabId;exit 1; }
node index.js "$1" inject "$2" "$(cat inject.file)" | jq -r '.data[0]'
