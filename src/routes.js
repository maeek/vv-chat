/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */

const config = require('./config');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const express = require('express');
const MobileDetect = require('mobile-detect');
const router = express.Router();
const Store = require('./Store');
const randomString = require('./randomString');
const fileManip = require('./fileManip');

router.get('/', function route_get_main(req, res) {
    res.redirect(301, '/login/');
});

/* 
 * User management route
 */
router.route('/manage/')
    .get(function route_get_manage(req, res) {
        if (req.session.auth == 'root') {
            res.sendFile(__dirname + '/assets/manage.html');
        } else {
            res.redirect(301, '/chat/');
        }
    })
    .post(function route_post_manage(req, res) {
        if (req.session.auth == 'root') {
            /* 
             * Check for usersFile 
             * Prevent unnecessary errors if you accidentaly deleted the file or you don't have permissions
             */
            if (!fs.existsSync(config.usersFile)) {
                console.log(`ERROR: file ${config.usersFile} doesn't exist`);
                res.json({ status: false });
            } else {
                switch (req.body.action) {
                case 'getUsers':
                    (function manage_getUsers() {
                        /* Get users list */
                        fileManip.readUsers(true, (err, data) => {
                            if(!err)
                                res.json(data.users);
                        });
                    })();
                    break;
                case 'deleteUser':
                    (function manage_deleteUser() {
                        function deleteUser(err,data) {
                            if(!err){
                                /* User to delete */
                                const user = req.body.user.trim();
                                /* Check if user is not root */
                                if (user != 'root') {
                                    data.users = data.users.filter(el => {
                                        /* Return all users other than user to delete */
                                        return el.clientId != user;
                                    });
                                    /* Write changes */
                                    fileManip.writeUsers(data, (error)=>{
                                        if(!error)
                                            res.json({ status: true });
                                        else
                                            res.json({ status: false });                                                                            
                                    });
                                } else {
                                    res.json({ status: false });
                                }
                            }
                        }
                        fileManip.readUsers(false, deleteUser);
                    })();
                    break;
                case 'block':
                    (function manage_blockUsers() {
                        
                        /* Block / Unblock user */
                        function blockUser(data) {
                            
                            /* Array of users ids to block */
                            const uids = req.body.uids;
                            
                            /* Block / Unblock */
                            const toBlock = req.body.block ? true : false;
                            
                            /* Check if array contain root, if not found, proceed*/
                            if(uids.indexOf('root') != -1){
                                data.users = data.users.map(el => {
                            
                                    /* Match user to block / unblock in users list */
                                    if (uids.indexOf(el.clientId) != -1) {
                                        /* Change status */
                                        el.blocked = toBlock;
                                    }
                                    /* Return updated data */
                                    return el;
                                });
                                
                                /* Write changes */
                                fileManip.writeUsers(data, (err)=> {
                                    if(!err)
                                        res.json({ status: true, blocked: uids });
                                    else 
                                        res.json({ status: false });
                                });
                            } else {
                                /* Return if array contain root user */
                                res.json({ status: false });
                            }
                        }
                        
                        fileManip.readUsers(false, (err, data) => {
                            if(!err)
                                blockUser(data); 
                        });
                    })();
                    break;
                case 'createUser':
                    (function manage_createUser() {
                        /* Create new user */
                        function createUser(data, user){
                            /* Username format */
                            const format = /^[a-zA-Z0-9@!.-]+$/;
                            /* Generate salt */
                            const salt = bcrypt.genSaltSync();
                            /* Generate random password */
                            const newPassword = randomString();
                            /* Hash password */
                            bcrypt.hash(newPassword, salt, function(err, hash) {
                                if (!err) {
                                    /* New user object */
                                    const newUser = {
                                        username: user,
                                        password: hash,
                                        first: true,
                                        clientId: randomString(22),
                                        blocked: false
                                    };
                                    
                                    /* Return user matching new username */
                                    const checkUsers = data.users.filter(el => {
                                        return el.username == user;
                                    });

                                    /* Check if username is taken and satisfy username format */                                    
                                    if (checkUsers.length == 0 && format.test(user)) {
                                        /* Add new user to the array */
                                        data.users.push(newUser);
                                        fileManip.writeUsers(data, err=>{
                                            /* If write was successful send new user data */
                                            if(!err)
                                                res.json({ status: true, user: user.toLowerCase().trim(), password: newPassword, clientId: newUser.clientId });
                                            else
                                                console.log(`ERROR: failed to create user at "/manage" (createUser) - error description:\n${err}`);                                                                        
                                        });
                                    } else {
                                        /* If username was taken or username didn't match the format */
                                        res.json({ status: false });
                                    }
                                } else {
                                    /* Password hash was unsuccessfull */
                                    console.log(`ERROR: failed to hash password at "/manage" (createUser) for user: "${user}" error description:\n${err}`);
                                    res.json({ status: false });
                                }
                            });
                        }
                        /* New username */
                        const user = req.body.user.toLowerCase().trim();
                        fileManip.readUsers(false, (err, data)=>{
                            if(!err)
                                createUser(data, user);
                        });
                        
                    })();
                    break;
                case 'resetPassword':
                    (function manage_resetPassword() {
                        /* Reset password */
                        function resetPassword(data, user) {
                            /* Generate new password */
                            const password = randomString();
                            /* Generate salt */
                            const salt = bcrypt.genSaltSync();
                            /* Hash password */
                            bcrypt.hash(password, salt, function(err, hash) {
                                if (!err) {
                                    
                                    /* Update password */
                                    data.users = data.users.filter(el => {
                                        if (el.clientId == user) {
                                            el.password = hash;
                                            el.first = true;
                                        }
                                        return el;
                                    });
                                    
                                    /* Save changes */
                                    fileManip.writeUsers(data, error=>{
                                        if(!error)
                                            res.json({ status: true, password: password });
                                    });
                                    
                                } else {
                                    console.log(`ERROR: failed to hash password at "/manage" (resetPassword) for user: "${user}" error description:\n${err}`);
                                    res.json({ status: false });
                                }
                            });    
                        }
                        
                        const clientId = req.body.user.trim();
                        fileManip.readUsers(false, (err,data)=> {
                            if(!err)
                                resetPassword(data, clientId);
                        });
                        
                    })();
                    break;
                default:
                    /* Return false if action didn't match */
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
            res.redirect(301, '/setup/');
        } else {
            /* Username */
            const name = req.session.user;
            /* Read users list */
            fileManip.readUsers(false, (err, data)=>{
                if(!err) {
                    let changed = false;
                    let newpass;
                    /* Generate salt */
                    const salt = bcrypt.genSaltSync();
                    
                    /* If first login */
                    if(req.session.setup){
                        const password = req.body.password;
                        const repassword = req.body.repassword;
                        
                        /* Check if passwords match */
                        if (password != repassword && password.length < 5) {
                            res.redirect(301, '/setup/');
                        } else {
                            changed = true;
                            newpass = password;
                        }
                    } else {
                        const oldPassword = req.body.oldPassword;
                        const password = req.body.password;
                        
                        if (password.length > 4) {
                            const userHash = data.users.filter(user => {
                                return user.username == req.session.user;
                            });
                            /* Compare old password with the one provided by user */
                            if (bcrypt.compareSync(oldPassword, userHash[0].password) && userHash.length == 1) {
                                newpass = password;
                                changed = true;
                            }
                        } else {
                            res.json({
                                status: false
                            });
                        }
                    }
                   
                    if(changed){
                        /* Hash password */
                        bcrypt.hash(newpass, salt, function setup_first_hash(error, hash) {
                            if(!error){
                                /* Update user */
                                data.users = data.users.filter(el => {
                                    if (el.username == name) {
                                        el.password = hash;
                                        el.first = false;
                                    }
                                    return el;
                                });
                                /* Write changes */
                                fileManip.writeUsers(data, w_err=>{
                                    if(!w_err && req.session.setup) {
                                        req.session.setup = false;                            
                                        req.session.save((s_error) => {
                                            if (!s_error) {
                                                res.redirect(301, '/chat/');
                                            } else {
                                                console.log(s_error);
                                            }
                                        });
                                    } else {
                                        res.json({status: true});
                                    }
                                });
                            }
                        });    
                    } else {
                        console.log('FAILED');
                        if(req.session.setup) 
                            res.redirect(301, '/setup/');    
                        else
                            res.json({status: false});                        
                    }           
                } 
            });
        }
    });

/* 
 * Login route
 */
router.route('/login/')
    .get(function route_get_login(req, res) {
        if (!req.session.valid) {
            res.sendFile(__dirname + '/assets/login.html');
        } else {
            res.redirect(301, '/chat/');
        }
    })
    .post(function route_post_login(req, res) {

        /* 
         * Check for usersFile 
         * Prevent unnecessary errors if you accidentaly deleted the file or you don't have permissions
         */
        if (!fs.existsSync(config.usersFile)) {
            console.log(`ERROR: file ${config.usersFile} doesn't exist`);
            res.redirect(301, '/login/#error/misconfigured_server');
        } else {
            const username = req.body.username.trim().toLowerCase(),
                password = req.body.password.trim();
            const usersFile = JSON.parse(fs.readFileSync(config.usersFile));

            usersFile.users = usersFile.users.filter(user => {
                return user.username == username;
            });
            if(req.session){
                req.session.regenerate(err =>{
                    if (err != null) console.log('ERROR: Session failed to regenerate, description:\n' + err);                    
                });
            }
            if (usersFile.users.length == 1) {
                bcrypt.compare(password, usersFile.users[0].password, (err, result) => {
                    if (err) {
                        console.log(`ERROR: failed to hash password at "/login/" for user: "${username}" error description:\n${err}`);
                        res.redirect(301, '/login/#error');
                    } else {
                        if (result === true) {
                            if (!usersFile.users[0].blocked) {
                                const userData = usersFile.users[0].username,
                                    clientId = usersFile.users[0].clientId;
                                const os = new MobileDetect(req.headers['user-agent']).os();
                                req.session.os = os == null ? 'PC' : os;
                                req.session.user = userData;
                                req.session.valid = true;
                                req.session.clientId = clientId;
                                res.cookie('user', userData, {
                                    path: '/',
                                    secure: config.https,
                                    maxAge: 60 * 60 * 1000 * 24
                                });
                                res.cookie('clientId', clientId, {
                                    path: '/',
                                    secure: config.https,
                                    maxAge: 60 * 60 * 1000 * 24
                                });
                                if (userData == 'root') {
                                    req.session.auth = 'root';
                                    req.session.save((err) => {
                                        if (!err) {
                                            res.redirect(301, '/manage/');
                                        } else {
                                            console.log(err);
                                        }
                                    });
                                } else {
                                    req.session.auth = 'user';
                                    if (usersFile.users[0].first) {
                                        req.session.setup = true;
                                        res.redirect(301, '/setup/');
                                    } else {
                                        req.session.save((err) => {
                                            if (!err) {
                                                res.redirect(301, '/chat/');
                                            } else {
                                                console.log(err);
                                            }
                                        });

                                    }
                                }
                            } else {
                                res.redirect(301, '/login/#disabled');
                            }
                        } else {
                            res.redirect(301, '/login/#wrong');
                        }
                    }
                });
            } else {
                res.redirect(301, '/login/#wrong');
            }
        }
    });

/* 
 * Chat application route
 */
router.get('/chat/', function route_get_chat(req, res) {
    if (req.session.valid) {
        if (req.session.auth != 'root') {
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
            if (err != null) console.log('ERROR: Session already destroyed, description:\n' + err);
        });
        req.session.destroy((err) => {
            if (err != null) console.log('ERROR: Session already destroyed, description:\n' + err);
        });
        res.clearCookie('user.sid');
        res.clearCookie('user');
        res.clearCookie('io');
        res.clearCookie('clientId');
    }
    res.set('Cache-Control', 'no-cache');
    res.redirect(301, '/login/');
});

/* 
 * 404 handler
 */
router.all('*', function route_not_found(req, res) {
    res.status(404).sendFile(__dirname + '/assets/error.html');
});

module.exports = router;