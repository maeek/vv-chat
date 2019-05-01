/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */


const config = require('./src/config');

/* Docker SSL cert settings */
if (process.env.DOCKER) {
    config.roomsFile = '/app/input/rooms.json';
    config.usersFile = '/app/input/users.json';
    config.certificateFiles = {
        cert: '/app/input/cert.pem',
        ca: '/app/input/chain.pem',
        priv: '/app/input/privkey.pem',
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
            id: config.defaultRoom.id,
            name: config.defaultRoom.name,
            icon: config.defaultRoom.icon
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
const router = require('./src/routes');
const getTime = (raw) => raw ? new Date(new Date().now() - (new Date().getTimezoneOffset() * 60000)) : new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');




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
const Store = require('./src/Store');
if (!fs.existsSync(__dirname + "/sessions/")) fs.mkdirSync(__dirname + "/sessions/", 744);
let session = expressSession({
    name: 'user.sid',
    path: '/',
    secret: config.sessionSecret,
    store: Store,
    resave: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: config.https,
        maxAge: 60 * 60 * 1000 * 24
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



/* 
 * Static dist/public/ 
 */
app.use('/', express.static(path.join(__dirname, '/src/static'), { redirect: false }));



/* 
 * 404 handler
 */
router.all('*', function(req, res, next) {
    res.status(404).sendFile(__dirname + '/src/assets/error.html');
});

/* 
 * Router 
 */
app.use(router);


/* 
 * Allow socket.io use session
 */
io.of("/chat").use(sharedsession(session, { autoSave: true }));

/* 
 * Socket.io 
 */
io.of('/chat').on('connection', function(socket) {
    let room = config.defaultRoom.name;

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
                    return typeof el !== undefined && el != null && el.socketId;
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
        // socket.join(room);
    }

    /* 
     * Notify users when client connects/disconnects
     */
    socket.on("userConnected", function(wRoom) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            let roomIcon, rid;
            socket.leaveAll();
            nRoom = wRoom ? wRoom : config.defaultRoom.id;

            roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8")).list;
            roomList = roomList.filter(el => {
                if (el.id == nRoom) {
                    roomName = el.name;
                    roomIcon = el.icon;
                    rid = el.id
                    return el;
                }
            });
            if (roomList.length == 0) {
                roomName = config.defaultRoom.name;
                rid = config.defaultRoom.id;
                roomIcon = config.defaultRoom.icon;
            }
            room = rid;
            socket.join(room);
            io.of('/chat').in(room).clients((error, clients) => {
                socket.to(`${room}`).emit("userConnected", {
                    status: true,
                    self: false,
                    username: socket.handshake.session.user,
                    time: getTime(),
                    users: clients.length,
                    roomName: roomName,
                    roomIcon: roomIcon,
                    rid: rid
                });
                socket.emit("userConnected", {
                    status: true,
                    self: true,
                    username: socket.handshake.session.user,
                    time: getTime(),
                    users: clients.length,
                    roomName: roomName,
                    roomIcon: roomIcon,
                    rid: rid
                });
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
                    return typeof el !== undefined && el != null && el.socketId;
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
    socket.on("roomList", function() {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            let roomList = fs.readFileSync(config.roomsFile, "utf-8");
            if (roomList) {
                roomList = JSON.parse(roomList).list;
                socket.emit("roomList", roomList);
            }
        } else {
            socket.leave(room);
            socket.emit("invalidSession", true);
        }
    });

    /* 
     * Changing active room
     */
    socket.on("changeRoom", function(wRoom, fn) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            nRoom = wRoom ? wRoom : config.defaultRoom.id;
            roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8")).list;
            roomList = roomList.filter(el => {
                if (el.id == nRoom) {
                    roomName = el.name;
                    roomIcon = el.icon;
                    rid = el.id
                    return el;
                }
            });
            if (roomList.length == 0) {
                roomName = config.defaultRoom.name;
                rid = config.defaultRoom.id;
                roomIcon = config.defaultRoom.icon;
            }
            if (rid == wRoom) {
                io.of('/chat').in(room).clients((error, clients) => {
                    socket.to(`${room}`).emit("userConnected", {
                        status: false,
                        self: false,
                        username: socket.handshake.session.user,
                        time: getTime(),
                        users: clients.length - 1
                    });

                    socket.leaveAll();
                    room = rid;
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
            fn({
                id: rid,
                name: roomName,
                icon: roomIcon,
            })
        }
    });

    /* 
     * Add rooms
     */
    socket.on("addRoom", function(newRoom, fn) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            if (socket.handshake.session.auth == "root" || socket.handshake.session.auth == "mod") {
                cRoom = newRoom;
                let roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8"));
                const format = /^[a-zA-Z0-9@!\.\-\sAaĄąĆćĘęŁłŃńÓóSsŚśŹźŻż]+$/;
                if (roomList) {
                    if (format.test(cRoom.name) && cRoom.name.length <= 30) {
                        cRoom.icon = cRoom.icon ? cRoom.icon : JSON.parse(fs.readFileSync(__dirname + "/dist/public/js/emoji.json", "utf-8")).list[Math.floor(Math.random() * 813)];
                        const newRoom = {
                            id: randomString(10),
                            name: cRoom.name,
                            icon: cRoom.icon,
                            password: {
                                required: false,
                                hash: ""
                            }
                        };
                        roomList.list.push(newRoom);
                        fs.writeFile(config.roomsFile, JSON.stringify(roomList), (err) => {
                            if (!err) {
                                fn({
                                    status: true,
                                    id: cRoom.id,
                                    name: cRoom.name,
                                    icon: cRoom.icon
                                });
                                io.of("/chat").emit("roomList", roomList.list);
                            }
                        });
                    } else {
                        fn({
                            status: false,
                            message: "Name not satisfying requirements"
                        });
                    }
                } else {
                    console.log(`Error: Couldn't read: ${config.roomsFile}`);
                }
            } else {
                fn({
                    status: false,
                    message: "Not authorized"
                });
            }
        }
    });

    /* 
     * Delete rooms
     */
    socket.on("deleteRoom", function(rid) {
        if (typeof socket.handshake.session !== undefined && socket.handshake.session.valid) {
            if (socket.handshake.session.auth == "root" || socket.handshake.session.auth == "mod") {
                let roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8"));
                roomList.list = roomList.list.filter(el => {
                    return el.id != rid;
                });
                fs.writeFile(config.roomsFile, JSON.stringify(roomList), (err) => {
                    if (!err) {
                        io.of("/chat").to(rid).emit("changeRoom", config.defaultRoom.id);
                        io.of("/chat").emit("roomList", roomList.list);
                    }
                });
            }
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