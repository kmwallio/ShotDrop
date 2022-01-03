var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var cookieSession = require('cookie-session');
var bcrypt = require('bcrypt');
var randomstring = require("randomstring");

var db = new sqlite3.Database('shot.db');
const saltRounds = 10;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'ShotDrop' });
});

router.post('/', function(req, res, next) {
    var username = req.body.username, password = req.body.password;
    db.get("SELECT * FROM Users WHERE username=?", [username], function (err, rows) {
        if (rows === undefined) {
            res.render('signup', { title: 'ShotDrop Not Logged In', registered: true, message: "Please check your username and password." });
        } else {
            bcrypt.compare(password, rows["password"], function(err, login){
                if (login) {
                    req.session.user = username;
                    req.session.streamkey = rows["streamkey"];
                    res.render('index', { title: 'ShotDrop', user: username, streamkey: rows["streamkey"], photos: "", rooms: "" });
                } else {
                    res.render('signup', { title: 'ShotDrop Not Logged In', registered: true, message: "Please check your username and password." });
                }
            });
        }
    });
});

module.exports = router;