/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

const config = require('./config');
const fs = require('fs');
const bcrypt = require('bcrypt-nodejs');
const express = require('express');
const MobileDetect = require('mobile-detect');
const router = express.Router();
const Store = require('./Store');
const randomString = require('./randomString');

router.get('/', function route_get_main(req, res) {
    res.redirect(301, "/login/");
});

/* 
 * Allow access to /static/js/manage.js only for root
 */
router.get('/js/manage.js', function route_get_manageJs(req, res) {
    if (req.session.valid && req.session.auth == "root") {
        res.sendFile(__dirname + '/static/js/manage.js');
    } else {
        res.status(404).sendFile(__dirname + '/assets/error.html');
    }
});

/* 
 * User management route
 */
router.route('/manage/')
    .get(function route_get_manage(req, res) {
        if (req.session.auth == "root") {
            res.sendFile(__dirname + '/assets/manage.html');
        } else {
            res.redirect(301, '/chat/');
        }
    })
    .post(function route_post_manage(req, res) {
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
                        (function manage_getUsers() {
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
                        (function manage_deleteUser() {
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
                        (function manage_createUser() {
                            let userObj = JSON.parse(fs.readFileSync(config.usersFile));
                            const user = req.body.user.toLowerCase().trim();
                            const format = /^[a-zA-Z0-9@!\.\-]+$/;
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
                                    if (checkUsers.length == 0 && format.test(user)) {
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
                        (function manage_resetPassword() {
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
router.route('/setup/')
    .get(function route_get_setup(req, res) {
        if (req.session.setup) {
            res.sendFile(__dirname + '/assets/changePass.html');
        } else {
            res.redirect(301, '/chat/');
        }
    })
    .post(function route_post_setup(req, res) {
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
                    bcrypt.hash(password, salt, null, function setup_first_hash(err, hash) {
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
                            req.session.save((err) => {
                                if (!err) {
                                    res.redirect(301, "/chat/");
                                } else {
                                    console.log(err);
                                }
                            });
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
                        bcrypt.hash(password, salt, null, function setup_hash(err, hash) {
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
 * Login route
 */
router.route('/login/')
    .get(function route_get_login(req, res) {
        if (!req.session.valid) {
            /* Clear expired/invalid cookies */
            res.clearCookie("user.sid");
            res.clearCookie("user");
            res.clearCookie("io");
            res.clearCookie("clientId");
            res.sendFile(__dirname + '/assets/login.html');
        } else {
            res.redirect(301, "/chat/");
        }
    })
    .post(function route_post_login(req, res) {

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
                bcrypt.compare(password, usersFile.users[0].password, (err, result) => {
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
                                path: "/",
                                secure: config.https,
                                maxAge: 60 * 60 * 1000 * 24
                            });
                            res.cookie('clientId', clientId, {
                                path: "/",
                                secure: config.https,
                                maxAge: 60 * 60 * 1000 * 24
                            });
                            if (userData == "root") {
                                req.session.auth = "root";
                                req.session.save((err) => {
                                    if (!err) {
                                        res.redirect(301, "/manage/");
                                    } else {
                                        console.log(err);
                                    }
                                });
                            } else {
                                req.session.auth = "user";
                                if (usersFile.users[0].first) {
                                    req.session.setup = true;
                                    res.redirect(301, "/setup/");
                                } else {
                                    req.session.save((err) => {
                                        if (!err) {
                                            res.redirect(301, "/chat/");
                                        } else {
                                            console.log(err);
                                        }
                                    });

                                }
                            }
                        } else {
                            res.redirect(301, "/login/#wrong");
                        }
                    }
                });
            } else {
                res.redirect(301, "/login/#wrong");
            }
        }
    });

/* 
 * Chat application route
 */
router.get('/chat/', function route_get_chat(req, res) {
    if (req.session.valid) {
        if (req.session.auth != "root") {
            if (req.session.setup) {
                res.redirect(301, '/setup/');
            } else {
                res.status(200).sendFile(__dirname + '/assets/chat.html');
            }
        } else {
            res.redirect(301, '/manage/');
        }
    } else {
        res.redirect(301, '/logout');
    }
});


/* 
 * Deleting session
 */
router.get('/logout', function route_get_logout(req, res) {
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
 * 404 handler
 */
router.all('*', function route_not_found(req, res, next) {
    res.status(404).sendFile(__dirname + '/assets/error.html');
});

module.exports = router;