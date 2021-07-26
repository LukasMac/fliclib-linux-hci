#!/bin/bash

./bin/armv6l/flicd  -f flic.sqlite3 -d

sleep 1

node ./clientlib/nodejs/example.js