/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.4
 * 
 */


'use strict'
const config = {
    name: "VV-Chat",
    port: 3000,
    https: true,
    sessionSecret: 'secretPhrase',
    usersFile: "src/users.json",
    certificateFiles: {
        cert: 'path_to_cert.pem',
        ca: 'path_to_chain.pem',
        priv: 'path_to_privkey.pem'
    }
}

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
let server;


/* Checking if users file exists */
if (!fs.existsSync(config.usersFile)) {
    console.log(`${config.usersFile} not found!`);
    const password = randomString();
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt)
    fs.writeFileSync(config.usersFile, JSON.stringify({
        users: [{
            username: "root",
            password: hash,
            first: false
        }]
    }));
    console.log(`Created file:  ${config.usersFile}`);
    console.log(`---- Management account - name ----\n`);
    console.log("\troot\n");
    console.log(`---- Management account - password ----\n`);
    console.log(`\t${password}\n`);
}

/* Checking if certificate files exist */
let certFlag = true;
for (const file in config.certificateFiles)
    if (!fs.existsSync(config.certificateFiles[file]))
        certFlag = false;

if (certFlag) {
    /* Certificates exist, starting HTTPS */
    const privateKey = fs.readFileSync(config.certificateFiles.priv, 'utf8');
    const certificate = fs.readFileSync(config.certificateFiles.cert, 'utf8');
    const ca = fs.readFileSync(config.certificateFiles.ca, 'utf8');
    const credentials = { key: privateKey, cert: certificate, ca: ca };

    server = require('https').createServer(credentials, app);
    config.https = true;
} else {
    /* No certificates, starting HTTP */
    console.log(`Couldn't find one or all of the certificates in:\n${Object.values(config.certificateFiles).join("\n")}`);
    server = require('http').createServer(app);
    config.https = false;
}


const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const expressSession = require('express-session');
const sharedsession = require('express-socket.io-session');
const FileStore = require('session-file-store')(expressSession);





app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function(req, res, next) {
    res.removeHeader("X-Powered-By");
    next();
});

let session = expressSession({
    key: 'user_sid',
    name: 'user_sid',
    secret: config.sessionSecret,
    store: new FileStore({ path: "dist/sessions" }),
    resave: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24)
    }
});

app.use(session);
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});
const sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/chat');
    } else {
        next();
    }
};

app.get('/js/manage.js', function(req, res) {
    if (req.session.user && req.cookies.user_sid && req.session.auth == "root") {
        res.sendFile(__dirname + "/public/js/manage.js");
    } else {
        res.status(404).sendFile(__dirname + "/public/error.html");
    }
});



server.listen(config.port, () => {
    console.log(`### (${config.https?"HTTPS":"HTTP"}) ${config.name} listening on port ${config.port} ###`);
});

function randomString(length = 15) {
    const chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    let string = "";
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}




app.get('/', sessionChecker, function(req, res) {
    res.redirect("/login");
});
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/login.html');
    })
    .post((req, res) => {
        const username = req.body.username.trim().toLowerCase(),
            password = req.body.password.trim();
        const usersFile = JSON.parse(fs.readFileSync(config.usersFile));

        usersFile.users = usersFile.users.filter(user => {
            return user.username == username;
        });

        if (usersFile.users.length == 1) {
            bcrypt.compare(password, usersFile.users[0].password, function(err, result) {
                if (err) { res.redirect(`/login#error`) }
                if (result === true) {
                    const userData = usersFile.users[0].username;
                    req.session.user = userData;
                    req.session.valid = true;
                    res.cookie('user', userData, {
                        expires: new Date(Date.now() + 60 * 60 * 1000 * 24)
                    });
                    if (userData == "root") {
                        req.session.auth = "root";
                        res.redirect("/manage");
                    } else {
                        req.session.auth = "user";
                        if (usersFile.users[0].first) {
                            req.session.setup = true;
                            res.redirect("/setup");
                        } else {
                            res.redirect("/chat");
                        }
                    }
                } else {
                    res.redirect("/login#wrong");
                    req.session.valid = false;
                }
            });
        } else {
            res.redirect("/login#wrong");
        }


    });

app.route('/manage')
    .get((req, res) => {
        if (req.session.user && req.cookies.user_sid && req.session.auth == "root") {
            res.sendFile(__dirname + '/src/manage.html');
        } else {
            res.redirect('/chat');
        }
    })
    .post((req, res) => {
        if (req.session.user && req.cookies.user_sid && req.session.auth == "root") {
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
                        bcrypt.hash(newPassword, salt, function(err, hash) {
                            if (!err) {
                                const newUser = {
                                    username: user,
                                    password: hash,
                                    first: true
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
                        bcrypt.hash(password, salt, function(err, hash) {
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
    });


app.route('/setup')
    .get((req, res) => {
        if (req.session.user && req.cookies.user_sid && req.session.setup) {
            res.sendFile(__dirname + '/src/changePass.html');
        } else {
            res.redirect('/chat');
        }
    })
    .post((req, res) => {
        if (req.session.user && req.cookies.user_sid) {
            if (req.session.setup) {
                const password = req.body.password;
                const repassword = req.body.repassword;
                const name = req.session.user;
                if (password != repassword && password.length < 5) {
                    res.redirect("/setup");
                } else {
                    const salt = bcrypt.genSaltSync();
                    let usersObj = JSON.parse(fs.readFileSync(config.usersFile));
                    bcrypt.hash(password, salt, function(err, hash) {
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
                            res.redirect("/chat");
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
                        bcrypt.hash(password, salt, function(err, hash) {
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


app.get('/chat', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        if (req.session.auth != "root") {
            if (req.session.setup) {
                res.redirect('/setup');
            } else {
                res.sendFile(__dirname + '/public/chat.html');
            }
        } else {
            res.redirect('/manage');
        }
    } else {
        res.redirect('/login');
    }
});
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        delete req.session.user;
        delete req.session.valid;
        delete req.session.auth;

        res.clearCookie('user_sid');
        res.clearCookie("user");
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.use(express.static(path.join(__dirname, '/public')));
app.use(function(req, res) {
    res.status(404).sendFile(__dirname + "/public/error.html");
});



io.of("/chat").use(sharedsession(session, { autoSave: true }));
io.of('/chat').on('connection', function(socket) {
    if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
        socket.join("room");
    }

    socket.on("userConnected", function() {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            io.of('/chat').in("room").clients((error, clients) => {
                socket.to("room").emit("userConnected", {
                    status: true,
                    self: false,
                    username: socket.handshake.session.user,
                    time: new Date().toJSON().substring(10, 19).replace('T', ' '),
                    users: clients.length
                });
                socket.emit("userConnected", {
                    status: true,
                    self: true,
                    username: socket.handshake.session.user,
                    time: new Date().toJSON().substring(10, 19).replace('T', ' '),
                    users: clients.length
                })
            });
        } else {
            socket.emit("invalidSession", true);
        }
    });

    socket.on("message", function(data) {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            if (data.message != "" && data.message.length > 0)
                socket.to("room").emit("message", {
                    username: socket.handshake.session.user,
                    message: data.message,
                    time: new Date().toJSON().substring(10, 19).replace('T', ' '),
                    mid: data.mid
                });
        } else {
            socket.leave("room");
        }
    });

    socket.on("image", function(image) {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            if (image.type.indexOf("image") >= 0) {
                socket.to("room").emit("image", {
                    username: socket.handshake.session.user,
                    name: image.name,
                    type: image.type,
                    time: new Date().toJSON().substring(10, 19).replace('T', ' '),
                    img: image.blob,
                    mid: image.mid
                });
            }
        } else {
            socket.leave("room");
        }
    });
    socket.on("reverseMessage", function(mid) {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            if (mid.indexOf(socket.id) > 0) {
                socket.nsp.to("room").emit("reverseMessage", mid);
            }
        }
    });
    socket.on("typing", function(user) {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            socket.to("room").emit("typing", user);
        }
    });
    socket.on("read", function(user) {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            socket.to("room").emit("read", user);
        }
    });

    socket.on("disconnect", function() {
        if (socket.handshake.session.valid && typeof socket.handshake.session !== undefined) {
            io.of('/chat').in("room").clients((error, clients) => {
                socket.nsp.to("room").emit("userConnected", {
                    status: false,
                    self: false,
                    username: socket.handshake.session.user,
                    time: new Date().toJSON().substring(10, 19).replace('T', ' '),
                    users: clients.length
                });
            });
        }
    });
});