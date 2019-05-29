/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 *
 *   You can generate password from command line 
 *   Usage: node passwordHash.js password
 * 
 */
const bcrypt = require('bcrypt-nodejs');
const args = process.argv.slice(2);
var salt = bcrypt.genSaltSync();
for (let i = 0; i < args.length; i++) {
    bcrypt.hash(args[i], salt, function(err, hash) {
        console.log(hash + '\n');
    });
}