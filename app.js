
var express = require('express');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var sqlite3 = require('sqlite3').verbose();
const appRoot = require('app-root-path');
var uuid = require('uuid');
const { networkInterfaces } = require('os');
const { Netmask } = require('netmask');
const spawn = require('child_process').spawn;

var app = express();
var db = new sqlite3.Database('shot.db');
db.serialize(function() {
    db.run("CREATE TABLE if not exists `Images` (`Src` TEXT, `UserId` INTEGER,`Id` INTEGER PRIMARY KEY AUTOINCREMENT);");
    db.run("CREATE TABLE if not exists `Users` ( `username` TEXT NOT NULL UNIQUE, `email` TEXT NOT NULL, `password` TEXT NOT NULL, `salt` TEXT NOT NULL, `streamkey` TEXT NOT NULL, `id` INTEGER PRIMARY KEY AUTOINCREMENT );");
    db.run("CREATE TABLE if not exists `Ftps` ( `UserId` INTEGER NOT NULL, `FtpCode` TEXT NOT NULL, `Enabled` INTEGER, `id` INTEGER PRIMARY KEY AUTOINCREMENT );");
});

const nets = networkInterfaces();
function getNetworks() {
   let networks = {};
   for (const name of Object.keys(nets)) {
       for (const net of nets[name]) {
           if (net.family === 'IPv4' && !net.internal) {
               networks[net.address + "/24"] = net.address
           }
       }
   }
   return networks;
}

const resolverFunction = (address) => {
   const networks = getNetworks();
   for (const network in networks) {
       if (new Netmask(network).contains(address)) {
           return networks[network];
       }
   }
   return "0.0.0.0";
}

var IPs = Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family==='IPv4' && !i.internal && i.address || []), [])), []);

const FtpSrv = require('ftp-srv');
const port=8021;
console.log ("Using: %s", resolverFunction(IPs[0]));
const ftpServer = new FtpSrv({
    url: "ftp://" + resolverFunction(IPs[0]) + ":" + port,
    anonymous: false,
    pasv_url: IPs[0]
});

ftpServer.on('login', (data, resolve, reject) => { 
    db.get("SELECT * FROM Users WHERE username=?", [data.username], function (err, row) {
        if (row === undefined) {
            console.log("User name NOT found %s", data.username);
            return reject(new Error('Invalid username or password', 401));
        } else {
            console.log("User name found %s", data.username);
            db.get("SELECT * FROM Ftps WHERE UserId=? AND FtpCode=? AND Enabled=1", [row["id"], data.password], function (err, rows) {
                if (rows === undefined) {
                    console.log("FTP Code invalid");
                    return reject(new Error('Invalid username or password', 401));
                } else {
                    fs.mkdir(path.join(appRoot.toString(), "uploads", data.username),
                    { recursive: true }, (err) => {
                        if (err) {
                            console.log("Failed to allocate directory: %s", err);
                            return reject(new Error('Internal error', 401));
                        } else {
                            data.connection.on('STOR', (error, fileName) => {
                                console.log("Got: %s", fileName);
                                if (error) {
                                    console.log(error);
                                } else {
                                    var target_org = path.join(appRoot.toString(), "images", data.username, "org");
                                    var target_hd = path.join(appRoot.toString(), "images", data.username, "1080");
                                    var target_preview = path.join(appRoot.toString(), "images", data.username, "preview");
                                    var imageUuid = uuid.v4();
                                    var fName = imageUuid + ".jpeg";
                                    console.log("Moving: %s to %s", fileName, fName);
                                    fs.mkdir(target_org, { recursive: true }, (err) => {
                                        if (!err) {
                                            fs.mkdir(target_preview, { recursive: true }, (err) => {
                                                fs.mkdir(target_hd, { recursive: true }, (err) => {
                                                    if (!err) {
                                                        fs.rename(fileName, path.join(target_org, fName), () => {
                                                            db.run("INSERT INTO Images (UserId, Src) VALUES (?, ?)", [row["id"], imageUuid], function() {

                                                                const pFile = spawn('node',
                                                                    [
                                                                        path.join(appRoot.toString(), "resize.js"),
                                                                        path.join(target_org, fName),
                                                                        path.join(target_preview, fName),
                                                                        "640",
                                                                        "AUTO"
                                                                    ]);

                                                                pFile.stdout.on('data', (data) => {
                                                                    console.log(data.toString('utf8').replace(/[\n\r]/g, ''));
                                                                });
                                                                pFile.stderr.on('data', (data) => {
                                                                    console.error(data.toString('utf8').replace(/[\n\r]/g, ''));
                                                                });
                                                                pFile.on('close', (code) => {
                                                                    console.log("On Close: " + code);
                                                                    const p1080File = spawn('node',
                                                                    [
                                                                        path.join(appRoot.toString(), "resize.js"),
                                                                        path.join(target_org, fName),
                                                                        path.join(target_preview, fName),
                                                                        "AUTO",
                                                                        "1080"
                                                                    ]);

                                                                    p1080File.stdout.on('data', (data) => {
                                                                        console.log(data.toString('utf8').replace(/[\n\r]/g, ''));
                                                                    });
                                                                    p1080File.stderr.on('data', (data) => {
                                                                        console.error(data.toString('utf8').replace(/[\n\r]/g, ''));
                                                                    });
                                                                    p1080File.on('close', (code2) => {
                                                                        console.log("On Close: " + code2);
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                    });
                                }
                            });
                            return resolve({ root:path.join(appRoot.toString(), "uploads", data.username) });
                        }
                    });
                }
            });
        }
    });
});

app.set('trust proxy', 1); // trust first proxy
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
    name: 'shotsession',
    keys: ['photochef', 'hushhushphotophoto'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

var index = require('./routes/index');
var signup = require('./routes/signup');
var login = require('./routes/login');
var photos = require('./routes/photos');
var ftp = require('./routes/ftp');

app.use('/', index);
app.use('/signup', signup);
app.use('/photos', photos);
app.use('/ftp', ftp);
app.use('/login', login);
app.use('/static', express.static('images'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

ftpServer.listen().then(() => { 
    console.log('Ftp server is starting...')
});

module.exports = app;
