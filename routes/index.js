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
      res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey, photos: "", rooms: ""});
    } else {
      db.all("SELECT * FROM Ftps WHERE UserId=?", [rows["id"]], function(err, row2) {
        db.all("SELECT * FROM Images WHERE UserId=?", [rows["id"]], function(err, row3) {
          var roomRes = row2;
          var photoRes = row3;
          if (row3 === undefined) {
            photoRes = "";
          }
          if (row2 === undefined){
            roomRes = "";
          }
          res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey, photos: photoRes, rooms: roomRes});
        });
      });
    }
  });
});

module.exports = router;