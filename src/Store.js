/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

const fs = require('fs');
const expressSession = require('express-session');
const FileStore = require('session-file-store')(expressSession);

/* Create sessions folder if doesn't exist */
if (!fs.existsSync(__dirname + '/../sessions/')) fs.mkdirSync(__dirname + '/../sessions/', 774);

/* 
 * Initiate sessionStore 
 */
const Store = new FileStore({ path: __dirname + '/../sessions/', logFn: function() {} });

module.exports = Store;