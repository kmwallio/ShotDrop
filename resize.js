#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var logger = require('morgan');
const appRoot = require('app-root-path');
var uuid = require('uuid');
var Jimp = require('jimp');

const myArgs = process.argv.slice(2);

try {
    Jimp.read(myArgs[0], (err, photo) => {
        if (!err) {
            photo
            .resize((myArgs[2] == "AUTO") ? Jimp.AUTO : parseInt(myArgs[2]), (myArgs[3] == "AUTO") ? Jimp.AUTO : parseInt(myArgs[3])) // resize
            .quality(75) // set JPEG quality
            .write(myArgs[1]); // save
        }
    });
} catch(err) {
    console.error(err)
}