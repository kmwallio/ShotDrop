var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var cookieSession = require('cookie-session');
var bcrypt = require('bcrypt');
var randomstring = require("randomstring");

var db = new sqlite3.Database('shot.db');
const saltRounds = 10;

/* GET signup page. */
router.get('/', function(req, res, next) {
  res.render('signup', { title: 'User Registration', registered: false });
});

router.post('/', function(req, res, next) {
  var username = req.body.username, password = req.body.password, email = req.body.email;
  db.get("SELECT id FROM Users WHERE username=?",[username], function (err, rows) {
    if (rows === undefined) {
        bcrypt.hash(password, saltRounds, function(err, hash) {
            db.run("INSERT INTO Users (username, password, email, salt, streamkey) VALUES (?, ?, ?, '', ?)",
                [username, hash, email, randomstring.generate(32)], function(err) {
                    if (err) {
                        res.render('signup', { title: 'User Registration', registered: true, message: "Failed to register. <br> Error: " + err });
                        console.log (err);
                    } else {
                        res.render('signup', { title: 'User Registration', registered: true, message: "Created new user " + username });
                    }
                })
        });
    } else {
        res.render('signup', { title: 'User Registration', registered: true, message: "User already exists." });
    }
  });
});

module.exports = router;