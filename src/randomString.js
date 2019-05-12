/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

module.exports = function randomString(length = 15) {
    const chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789$_!?';
    let string = '';
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
};