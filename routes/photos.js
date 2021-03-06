var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var request = require('request');
var fs = require('fs');
var randomstring = require("randomstring");
const appRoot = require('app-root-path');

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
            console.error("Error for " + user + " got " + err);
            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        } else {
            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        }
    });
});

router.get('/delete/:photo', function(req, res, next){
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
            console.error("L Error for " + user + " got " + err);
            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
        } else {
            db.get("SELECT * FROM Images WHERE UserId=? AND Src=?", [rows["id"], req.params.photo], function (err, imgRows) {
                if (imgRows === undefined) {
                    console.error("Q Error for " + user + " got " + err);
                    res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
                } else {
                    db.run("DELETE FROM Images WHERE UserId=? AND Src=?", [rows["id"], req.params.photo], function(err) {
                        if (!err) {
                            var fName = req.params.photo + ".jpeg";
                            var target_org = path.join(appRoot.toString(), "images", user, "org", fName);
                            var target_preview = path.join(appRoot.toString(), "images", user, "preview", fName);
                            var target_hd = path.join(appRoot.toString(), "images", user, "1080", fName);
                            console.log("Deleting: %s", target_org);
                            try {
                                fs.unlinkSync(target_org);
                                fs.unlinkSync(target_preview);
                                fs.unlinkSync(target_hd);
                            } catch(err) {
                                console.error(err)
                            }
                            res.render('ftps', {title: "Deleted " + req.params.photo });
                        } else {
                            console.error("R Error for " + user + " got " + err);
                            res.render('index', { title: 'ShotDrop' , user: user, streamkey: streamkey});
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;