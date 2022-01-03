var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var request = require('request');
var fs = require('fs');
var randomstring = require("randomstring");

var db = new sqlite3.Database('shot.db');

router.get('/create', function(req, res, next) {
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
    var newRoom = randomstring.generate({
        length: 8,
        charset: 'alphanumeric'
    });
    console.log("Creating room " + newRoom);

    db.get("SELECT * FROM Users WHERE username=?", [user], function (err, rows) {
        if (rows === undefined) {
            console.log("Error for " + user + " got " + err);
            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        } else {
            db.run("INSERT INTO Ftps (UserId, FtpCode) VALUES (?, ?)", [rows["id"], newRoom], function() {
                res.render('ftps', {title: "New FTP " + newRoom });
            });
        }
    });
});

router.get('/enable/:room', function(req, res, next){
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
            db.run("UPDATE Ftps SET Enabled=1 WHERE UserId=? AND id=?", [rows["id"], parseInt(req.params.room)], function() {
                res.render('ftps', {title: "Enabled " + req.params.room });
            });
        }
    });
});

router.get('/disable/:room', function(req, res, next){
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
            db.run("UPDATE Ftps SET Enabled=0 WHERE UserId=? AND id=?", [rows["id"], parseInt(req.params.room)], function() {
                res.render('ftps', {title: "Disabled " + req.params.room });
            });
        }
    });
});

router.get('/delete/:room', function(req, res, next){
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
            db.run("DELETE FROM Ftps WHERE UserId=? AND id=?", [rows["id"], parseInt(req.params.room)], function() {
                res.render('ftps', {title: "Deleted " + req.params.room });
            });
        }
    });
});

module.exports = router;