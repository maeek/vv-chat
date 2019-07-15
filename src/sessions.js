/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */

/* Load session-store */
const Store = require('./Store');
const config = require('./config');
const expressSession = require('express-session');

/* Initiate session */
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
        maxAge: 60 * 60 * 1000 * 24 * 365
    }
});

module.exports = session;