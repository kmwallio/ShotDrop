var express = require('express');
var cookieSession = require('cookie-session');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var request = require('request');
var fs = require('fs');

var db = new sqlite3.Database('shot.db');

/* GET home page. */
router.get('/', function(req, res, next) {
  var user = "";
  var streamkey = "";
  if (req.session.user && req.session.streamkey) {
    user = req.session.user;
    streamkey = req.session.streamkey;
  }
  db.get("SELECT * FROM Users WHERE username=?", [user], function (err, rows) {
    if (rows === undefined) {
      res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey, rooms: ""});
    } else {
      db.all("SELECT * FROM Ftps WHERE UserId=?", [rows["id"]], function(err, row2) {
        if (row2 === undefined){
          res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey, rooms: ""});
        } else {
          console.log(row2);
          res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey, rooms: row2});
        }
      });
    }
  });
});

module.exports = router;