/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */


const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const router = require('./routes');

/* 
 * Initiate session 
 */
const session = require('./sessions');
app.use(session);

/* Set trust proxy for production */
app.set('trust proxy', 1);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(function(req, res, next) {
    /* Remove express default X-Powered-By header */
    res.removeHeader("X-Powered-By");
    /* CSP allow service worker */
    res.header('Content-Security-Policy', "worker-src 'self'");
    next();
});


/* 
 * Static dist/public/ 
 */
app.use('/', express.static(path.join(__dirname, '/static'), { redirect: false }));

/* 
 * Router 
 */
app.use(router);

module.exports = app;