/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.5
 * 
 */

const config = {
    name: "VV-Chat",
    port: 3000,
    https: true,
    sessionSecret: 'chattyPatty',
    usersFile: "src/users.json",
    roomsFile: "src/rooms.json",
    defaultRoomName: "Main",
    certificateFiles: {
        cert: 'server.crt',
        ca: 'server.csr', // not always necessary
        priv: 'server.key'
    }
}


/* Docker SSL cert settings */
if (process.env.DOCKER) {
    config.certificateFiles = {
        cert: '',
        priv: ''
    }
}

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt-nodejs');
const express = require('express');
const app = express();
let server;


/* 
 * Checking if users file exists 
 */
if (!fs.existsSync(config.usersFile)) {
    console.log(`${config.usersFile} not found, creating`);
    const password = randomString();
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt)
    fs.writeFileSync(config.usersFile, JSON.stringify({
        users: [{
            username: "root",
            password: hash,
            first: false,
            clientId: randomString(22)
        }]
    }));
    console.log(`Created file:  ${config.usersFile}`);
    console.log(`---- Management account - name ----\n`);
    console.log("\troot\n");
    console.log(`---- Management account - password ----\n`);
    console.log(`\t${password}\n`);
}

/* 
 * Checking if rooms file exists 
 */
if (!fs.existsSync(config.roomsFile)) {
    console.log(`${config.roomsFile} not found, creating.`);
    fs.writeFileSync(config.roomsFile, JSON.stringify({
        list: [{
            name: config.defaultRoomName,
            icon: "0x1f448"
        }]
    }));
}

/* 
 * Checking if certificate files exist 
 */
let certFlag = true;
for (const file in config.certificateFiles)
    if (!fs.existsSync(config.certificateFiles[file]))
        certFlag = false;

if (certFlag) {
    /* 
     * Certificates exist, starting HTTPS 
     */
    const privateKey = fs.readFileSync(config.certificateFiles.priv, 'utf8');
    const certificate = fs.readFileSync(config.certificateFiles.cert, 'utf8');
    const ca = fs.readFileSync(config.certificateFiles.ca, 'utf8');
    const credentials = { key: privateKey, cert: certificate, ca: ca };

    server = require('spdy').createServer(credentials, app);
    config.https = true;
} else {
    /* 
     * No certificates, starting HTTP, NOT SECURE!
     */
    console.log(`Couldn't find one or all of the certificates in:\n${Object.values(config.certificateFiles).join("\n")}`);
    server = require('http').createServer(app);
    config.https = false;
    console.log(`###################################\n#     SERVER RUNNING PLAIN HTTP   #\n###################################`);
}


const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const expressSession = require('express-session');
const sharedsession = require('express-socket.io-session');
const FileStore = require('session-file-store')(expressSession);
const MobileDetect = require('mobile-detect');
const getTime = () => new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');




app.set('trust proxy', 1);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function(req, res, next) {
    res.removeHeader("X-Powered-By");
    res.header('Content-Security-Policy', "worker-src 'self'");
    next();
});

/* 
 * Initiate session 
 */
const Store = new FileStore({ path: __dirname + "/sessions/", logFn: function() {} });
if (!fs.existsSync(__dirname + "/sessions/")) fs.mkdirSync(__dirname + "/sessions/", 744);
let session = expressSession({
    name: 'user.sid',
    secret: config.sessionSecret,
    store: Store,
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: config.https,
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24)
    }
});
app.use(session);
/* 
 * Starting express
 */
server.listen(config.port, (e) => {
    if (e) {
        console.log(e);
        return process.exit(1);
    } else {
        console.log(`### (${config.https?"HTTPS":"HTTP"}) ${config.name} listening on port ${config.port} ###`);
    }

});

function randomString(length = 15) {
    const chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789$_!?";
    let string = "";
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}




app.get('/', session, function(req, res) {
    res.redirect(301, "/login/");
});

/* 
 * Allow access to dist/public/js/manage.js only for root
 */
app.get('/js/manage.js', session, function(req, res) {
    if (req.session.valid && req.session.auth == "root") {
        res.sendFile(__dirname + "/public/js/manage.js");
    } else {
        res.status(404).sendFile(__dirname + "/src/error.html");
    }
});

/* 
 * User management route
 */
app.route('/manage/')
    .get(session, (req, res) => {
        if (req.session.auth == "root") {
            res.sendFile(__dirname + '/src/manage.html');
        } else {
            res.redirect(301, '/chat/');
        }
    })
    .post(session, (req, res) => {
        if (req.session.auth == "root") {
            /* 
             * Check for usersFile 
             * Prevent unnecessary errors if you accidentaly deleted the file or you don't have permissions
             */
            if (!fs.existsSync(config.usersFile)) {
                console.log(`ERROR: file ${config.usersFile} doesn't exist`);
                res.json({ status: false });
            } else {
                switch (req.body.action) {
                    case "getUsers":
                        (function() {
                            let userObj = JSON.parse(fs.readFileSync(config.usersFile));
                            for (let i = 0; i < userObj.users.length; i++) {
                                delete userObj.users[i].password;
                                delete userObj.users[i].first;
                            }
                            userObj.users = userObj.users.filter(el => {
                                return el.username != "root"
                            })
                            res.json(userObj.users);
                        })();

                        break;
                    case "deleteUser":
                        (function() {
                            let userObj = JSON.parse(fs.readFileSync(config.usersFile));
                            const user = req.body.user.trim();
                            if (user != "root") {
                                userObj.users = userObj.users.filter(el => {
                                    return el.username != user;
                                });
                                fs.writeFileSync(config.usersFile, JSON.stringify(userObj));
                                res.json({ status: true });
                            } else {
                                res.json({ status: false });
                            }
                        })();
                        break;
                    case "createUser":
                        (function() {
                            let userObj = JSON.parse(fs.readFileSync(config.usersFile));
                            const user = req.body.user.toLowerCase().trim();
                            const format = /[ !@#$%^&*()_+\-=[]{};':"\\|,.<>\/?]/;
                            const salt = bcrypt.genSaltSync();
                            const newPassword = randomString();
                            bcrypt.hash(newPassword, salt, null, function(err, hash) {
                                if (!err) {
                                    const newUser = {
                                        username: user,
                                        password: hash,
                                        first: true,
                                        clientId: randomString(22)
                                    };
                                    const checkUsers = userObj.users.filter(el => {
                                        return el.username == user;
                                    });
                                    if (checkUsers.length == 0 && format.test(user) === false) {
                                        userObj.users.push(newUser);
                                        fs.writeFileSync(config.usersFile, JSON.stringify(userObj));
                                        res.json({ status: true, user: user.toLowerCase().trim(), password: newPassword });
                                    } else {
                                        res.json({ status: false });
                                    }

                                } else {
                                    console.log(`ERROR: failed to hash password at "/manage" (createUser) for user: "${username}" error description:\n${err}`);
                                    res.json({ status: false });
                                }
                            })
                        })();
                        break;
                    case "resetPassword":
                        (function() {
                            let userObj = JSON.parse(fs.readFileSync(config.usersFile));
                            const user = req.body.user.trim();
                            const password = randomString();
                            const salt = bcrypt.genSaltSync();
                            bcrypt.hash(password, salt, null, function(err, hash) {
                                if (!err) {
                                    userObj.users = userObj.users.filter(el => {
                                        if (el.username == user) {
                                            el.password = hash;
                                            el.first = true;
                                        }
                                        return el;
                                    });

                                    fs.writeFileSync(config.usersFile, JSON.stringify(userObj));
                                    res.json({ status: true, password: password });
                                } else {
                                    console.log(`ERROR: failed to hash password at "/manage" (resetPassword) for user: "${username}" error description:\n${err}`);
                                    res.json({ status: false });
                                }
                            });
                        })();
                        break;
                    default:
                        res.json({ status: false });
                        break;
                }
            }
        }
    });

/* 
 * Password change route
 */
app.route('/setup/')
    .get(session, (req, res) => {
        if (req.session.setup) {
            res.sendFile(__dirname + '/src/changePass.html');
        } else {
            res.redirect(301, '/chat/');
        }
    })
    .post(session, (req, res) => {
        if (!fs.existsSync(config.usersFile)) {
            console.log(`ERROR: file ${config.usersFile} doesn't exist`);
            res.redirect(301, "/setup/");
        } else {
            if (req.session.setup) {
                const password = req.body.password;
                const repassword = req.body.repassword;
                const name = req.session.user;
                if (password != repassword && password.length < 5) {
                    res.redirect(301, "/setup/");
                } else {
                    const salt = bcrypt.genSaltSync();
                    let usersObj = JSON.parse(fs.readFileSync(config.usersFile));
                    bcrypt.hash(password, salt, null, function(err, hash) {
                        if (!err) {
                            usersObj.users = usersObj.users.filter(el => {
                                if (el.username == name) {
                                    el.password = hash;
                                    el.first = false;
                                }
                                return el;
                            });
                            fs.writeFileSync(config.usersFile, JSON.stringify(usersObj));
                            req.session.setup = false;
                            req.session.save();
                            res.redirect(301, "/chat/");
                        } else {
                            console.log(`ERROR: failed to hash password at "/setup/" for user: "${name}" error description:\n${err}`);
                        }
                    });
                }
            } else {
                const oldPassword = req.body.oldPassword;
                const password = req.body.password;
                if (password.length > 4) {
                    const name = req.session.user;
                    const salt = bcrypt.genSaltSync();
                    let usersObj = JSON.parse(fs.readFileSync(config.usersFile));
                    const userHash = usersObj.users.filter(user => {
                        return user.username == req.session.user;
                    });
                    if (bcrypt.compareSync(oldPassword, userHash[0].password) && userHash.length == 1) {
                        bcrypt.hash(password, salt, null, function(err, hash) {
                            if (!err) {
                                usersObj.users = usersObj.users.filter(el => {
                                    if (el.username == name)
                                        el.password = hash;
                                    return el;
                                });
                                fs.writeFileSync(config.usersFile, JSON.stringify(usersObj));
                                res.json({
                                    status: true
                                });
                            } else {
                                console.log(`ERROR: failed to hash password at "/setup/" for user: "${name}" error description:\n${err}`);
                                res.json({
                                    status: false
                                });
                            }
                        });
                    } else {
                        res.json({
                            status: false
                        });
                    }
                } else {
                    res.json({
                        status: false
                    });
                }
            }
        }
    });

/* 
 * Chat application route
 */
app.get('/chat/', session, (req, res) => {
    console.log(`URL /chat/: valid: ${req.session.valid}`);
    if (req.session.cookie.valid) {
        if (req.session.auth != "root") {
            if (req.session.setup) {
                res.redirect(301, '/setup/');
            } else {
                console.log(`URL /chat/: sending html}`);
                res.status(200).sendFile(__dirname + '/src/chat.html');
            }
        } else {
            res.redirect(301, '/manage/');
        }
    } else {
        console.log(`URL /chat/: redirecting to /logout/`);
        res.redirect(301, '/logout');
    }
});

/* 
 * Login route
 */
app.route('/login/')
    .get(session, (req, res) => {
        if (!req.session.valid)
            res.sendFile(__dirname + '/src/login.html');
        else
            res.redirect(301, "/chat/");
    })
    .post(session, (req, res) => {
        /* 
         * Check for usersFile 
         * Prevent unnecessary errors if you accidentaly deleted the file or you don't have permissions
         */
        if (!fs.existsSync(config.usersFile)) {
            console.log(`ERROR: file ${config.usersFile} doesn't exist`);
            res.redirect(301, "/login/#error/misconfigured_server");
        } else {
            const username = req.body.username.trim().toLowerCase(),
                password = req.body.password.trim();
            const usersFile = JSON.parse(fs.readFileSync(config.usersFile));

            usersFile.users = usersFile.users.filter(user => {
                return user.username == username;
            });

            if (usersFile.users.length == 1) {
                bcrypt.compare(password, usersFile.users[0].password, function(err, result) {
                    if (err) {
                        console.log(`ERROR: failed to hash password at "/login/" for user: "${username}" error description:\n${err}`);
                        res.redirect(301, `/login/#error`);
                    } else {
                        if (result === true) {
                            const userData = usersFile.users[0].username,
                                clientId = usersFile.users[0].clientId;
                            const os = new MobileDetect(req.headers['user-agent']).os();
                            req.session.os = os == null ? "PC" : os;
                            req.session.user = userData;
                            req.session.valid = true;
                            req.session.clientId = clientId;
                            res.cookie('user', userData, {
                                expires: new Date(Date.now() + 60 * 60 * 1000 * 24)
                            });
                            res.cookie('clientId', clientId, {
                                expires: new Date(Date.now() + 60 * 60 * 1000 * 24)
                            });
                            if (userData == "root") {
                                req.session.auth = "root";
                                req.session.save();
                                res.redirect(301, "/manage/");
                            } else {
                                req.session.auth = "user";
                                if (usersFile.users[0].first) {
                                    req.session.setup = true;
                                    req.session.save();
                                    res.redirect(301, "/setup/");
                                } else {
                                    req.session.save();
                                    res.redirect(301, "/chat/");
                                }
                            }
                        } else {
                            res.redirect(301, "/login/#wrong");
                            req.session.valid = false;
                            req.session.save();
                        }
                    }
                });
            } else {
                res.redirect(301, "/login/#wrong");
            }
        }
    });


/* 
 * Deleting session
 */
app.get('/logout', session, (req, res) => {
    if (req.session.valid) {
        Store.destroy(req.session.id, (err) => {
            if (err != null) console.log("ERROR: Session already destroyed, description:\n" + err);
        });
        req.session.destroy((err) => {
            if (err != null) console.log("ERROR: Session already destroyed, description:\n" + err);
        });
        res.clearCookie("user.sid");
        res.clearCookie("user");
        res.clearCookie("io");
        res.clearCookie("clientId");
    }
    res.set("Cache-Control", "no-cache");
    res.redirect(301, "/login/");
});

/* 
 * Static dist/public/
 */
app.use('/', express.static(path.join(__dirname, 'public'), { redirect: false }));


/* 
 * 404 handler
 */
app.get('*', function(req, res, next) {
    res.status(404).sendFile(__dirname + "/src/error.html");
});

/* 
 * Allow socket.io use session
 */
io.of("/chat").use(sharedsession(session, { autoSave: true }));

/* 
 * Socket.io 
 */
io.of('/chat').on('connection', function(socket) {
    let room = config.defaultRoomName;

    /* 
     * Get active sessions matching clientId
     */
    function activeSessions(clientId) {
        return new Promise(function(resolve, reject) {
            Store.list(function(el, list) {
                list = list.map((el) => {
                    let active = JSON.parse(fs.readFileSync(__dirname + "/sessions/" + el, 'utf-8'));
                    if (active.clientId == clientId)
                        return {
                            clientId: active.clientId,
                            socketId: active.socketId,
                            os: active.os,
                            user: active.user,
                            lastAccess: new Date(new Date(active.__lastAccess).getTime() - (new Date(active.__lastAccess).getTimezoneOffset() * 60000)).toJSON().substring(0, 19).replace('T', ' '),
                            status: true
                        };
                    else
                        return null;
                });
                list = list.filter((el) => {
                    return typeof el !== undefined && el != null;
                });
                if (list.length > 0)
                    resolve(list);
                else
                    reject(false);
            });
        });
    }

    /* 
     * Updating session and joining default room
     */
    if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
        socket.handshake.session.socketId = socket.id;
        socket.handshake.session.save();
        socket.join(room);
    }

    /* 
     * Notify users when client connects/disconnects
     */
    socket.on("userConnected", function() {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            io.of('/chat').in(room).clients((error, clients) => {
                socket.to(`${room}`).emit("userConnected", {
                    status: true,
                    self: false,
                    username: socket.handshake.session.user,
                    time: getTime(),
                    users: clients.length
                });
                socket.emit("userConnected", {
                    status: true,
                    self: true,
                    username: socket.handshake.session.user,
                    time: getTime(),
                    users: clients.length
                })
            });
            /* 
             * Update active sessions for clientId
             */
            activeSessions(socket.handshake.session.clientId).then((list) => {
                for (let i = 0; i < list.length; i++) {
                    io.of('/chat').to(`${list[i].socketId}`).emit("activeSessions", list);
                }
            }).catch(() => {
                console.log("No sessions");
            });
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Load active sessions for clientId
     */
    socket.on("activeSessions", function(user, fn) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            activeSessions(socket.handshake.session.clientId).then((list) => {
                fn(list);
            }).catch(() => {
                console.log("No sessions");
            });
        }
    });
    /* 
     * User can log out devices on which he's logged in
     */
    socket.on("removeSession", function(s, fn) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            const clientId = socket.handshake.session.clientId;
            Store.list(function(opt, list) {
                list = list.map((el) => {
                    let active = JSON.parse(fs.readFileSync(__dirname + "/sessions/" + el, 'utf-8'));
                    if (active.clientId == clientId && active.socketId == s) {
                        Store.destroy(el.substring(0, el.indexOf(".json")), (err) => {
                            if (err != null) console.log("ERROR: Session already destroyed, description:\n" + err);
                            io.of("/chat").to(`${s}`).volatile.emit("invalidSession", true);
                        });
                    } else {
                        if (active.clientId == clientId)
                            return {
                                clientId: active.clientId,
                                socketId: active.socketId,
                                os: active.os,
                                user: active.user,
                                lastAccess: new Date(new Date(active.__lastAccess).getTime() - (new Date(active.__lastAccess).getTimezoneOffset() * 60000)).toJSON().substring(0, 19).replace('T', ' ')
                            };
                        else
                            return null;
                    }
                });
                list = list.filter((el) => {
                    return typeof el !== undefined && el != null;
                });
                fn(list);
            });
        }
    });

    /* 
     * Sending/Receiving text messages
     */
    socket.on("message", function(data) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            if (data.message != "" && data.message.length > 0)
                socket.to(`${room}`).emit("message", {
                    username: socket.handshake.session.user,
                    message: data.message,
                    time: getTime(),
                    mid: data.mid
                });
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Sending/Receiving images
     */
    socket.on("image", function(image, fn) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            if (image.type.indexOf("image") >= 0) {
                socket.to(`${room}`).emit("image", {
                    username: socket.handshake.session.user,
                    name: image.name ? image.name : randomString(8),
                    type: image.type,
                    time: getTime(),
                    img: image.blob,
                    mid: image.mid
                });
                fn(true);
            }
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Deleting sent messages
     */
    socket.on("reverseMessage", function(mid) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            if (mid.indexOf(socket.handshake.session.clientId) > 0) {
                socket.nsp.to(`${room}`).emit("reverseMessage", mid);
            }
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Notify users when someones typing
     */
    socket.on("typing", function(user) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            socket.to(`${room}`).emit("typing", user);
        }
    });

    /* 
     * Not yet implemented
     */
    socket.on("read", function(user) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            socket.to(`${room}`).emit("read", user);
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Listing avialable chat rooms
     */
    socket.on("listRooms", function() {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            const roomList = fs.readFileSync(config.roomsFile, "utf-8");
            if (roomList) {
                roomList = JSON.parse(roomList).list;
                socket.emit("listRooms", roomList);
            }
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Changing active room
     */
    socket.on("changeRoom", function(newroom) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {

            io.of('/chat').in(room).clients((error, clients) => {
                socket.to(`${room}`).emit("userConnected", {
                    status: false,
                    self: false,
                    username: socket.handshake.session.user,
                    time: getTime(),
                    users: clients.length - 1
                });

                socket.leave(room);
                room = newroom;
                socket.join(room);
                io.of('/chat').in(room).clients((error, clients) => {
                    socket.to(`${room}`).emit("userConnected", {
                        status: true,
                        self: false,
                        username: socket.handshake.session.user,
                        time: getTime(),
                        users: clients.length
                    });
                    socket.emit("userConnected", {
                        status: true,
                        self: true,
                        username: socket.handshake.session.user,
                        time: getTime(),
                        users: clients.length
                    });
                });
            });
        }
    });

    /* 
     * Socket disconnect event, notifying users when user left
     */
    socket.on("disconnect", function() {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            io.of('/chat').in(room).clients((error, clients) => {
                socket.nsp.to(`${room}`).emit("userConnected", {
                    status: false,
                    self: false,
                    username: socket.handshake.session.user,
                    time: getTime(),
                    users: clients.length
                });
            });
            activeSessions(socket.handshake.session.clientId).then((list) => {
                for (let i = 0; i < list.length; i++) {
                    io.of('/chat').to(`${list[i].socketId}`).emit("activeSessions", list);
                }
            }).catch(() => {
                console.log("No sessions");
            });

        }
    });
});