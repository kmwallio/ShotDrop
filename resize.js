#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var logger = require('morgan');
const appRoot = require('app-root-path');
var uuid = require('uuid');
var sharp = require('sharp');

const myArgs = process.argv.slice(2);

console.log("Got: %s", myArgs);

try {
    sharp(myArgs[0])
        .resize({
            width: (myArgs[2] == "AUTO") ? null : parseInt(myArgs[2]),
            height: (myArgs[3] == "AUTO") ? null : parseInt(myArgs[3])
         }) // resize
        .toFile(myArgs[1]);
} catch(err) {
    console.error(err);
}