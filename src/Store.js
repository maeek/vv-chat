/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

const expressSession = require('express-session');
const FileStore = require('session-file-store')(expressSession);

/* 
 * Initiate sessionStore 
 */
console.log(__dirname + "/../sessions/");
const Store = new FileStore({ path: __dirname + "/../sessions/", logFn: function() {} });

module.exports = Store;