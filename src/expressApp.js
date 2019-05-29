/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */


const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const router = require('./routes');

/* 
 * Initiate session 
 */
const session = require('./sessions');
app.use(session);

/* Set trust proxy for production */
app.set('trust proxy', 1);

/* Allow cros origin requests */
app.use(cors());

/* Parse requests */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Parse cookies */
app.use(cookieParser());

/* Enable gzip compression */
app.use(compression());

app.use(function(req, res, next) {
    /* Remove express default X-Powered-By header */
    res.removeHeader('X-Powered-By');
    /* CSP allow service worker */
    res.header('Content-Security-Policy', 'worker-src \'self\'');
    next();
});


/* 
 * Static src/static/ 
 */
app.use('/', express.static(path.join(__dirname, '/static'), { redirect: false }));

/* 
 * Router 
 */
app.use(router);

module.exports = app;