var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var request = require('request');
var fs = require('fs');
var randomstring = require("randomstring");

var db = new sqlite3.Database('shot.db');

router.get('/', function(req, res, next) {
    var user = "";
    var streamkey = "";
    if (req.session.user && req.session.streamkey) {
        user = req.session.user;
        streamkey = req.session.streamkey;
    } else {
        console.log("User not logged in");
        res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        return;
    }

    db.get("SELECT * FROM Users WHERE username=?", [user], function (err, rows) {
        if (rows === undefined) {
            console.log("Error for " + user + " got " + err);
            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        } else {
            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        }
    });
});

router.get('/delete/:photo', function(req, res, next){

});

router.get('/:photo', function(req, res, next){

});

module.exports = router;