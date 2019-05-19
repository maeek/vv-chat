/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */


const fs = require('fs');
const config = require('./config');


/* 
 * Checking if certificate files exist 
 */
let certFlag = true,
    certNotFound = [],
    server;
for (const file in config.certificateFiles) {
    if (!fs.existsSync(config.certificateFiles[file])) {
        certNotFound.push(config.certificateFiles[file]);
        certFlag = false;
        config.https = false;
    }
}

/* Load express app */
const app = require('./expressApp');

if (certFlag) {
    /* 
     * Certificates exist, starting HTTPS 
     */
    const privateKey = fs.readFileSync(config.certificateFiles.priv, 'utf8');
    const certificate = fs.readFileSync(config.certificateFiles.cert, 'utf8');
    const ca = fs.readFileSync(config.certificateFiles.ca, 'utf8');
    const options = {
        protocols: ['h2', 'spdy/3.1', 'spdy/3', 'spdy/2'],
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    server = require('spdy').createServer(options, app);

} else {
    /* 
     * No certificates, starting HTTP, NOT SECURE!
     */
    console.log(`Couldn't find this certificates:\n${certNotFound.join('\n')}`);
    console.log('###################################\n#     SERVER RUNNING PLAIN HTTP   #\n###################################');
    server = require('http').createServer(app);
}

/* Load socket.io */
const io = require('socket.io')(server);
/* Load sockets functions */
require('./sockets')(io);

module.exports = server;