/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 *   Change settings for your own needs
 * 
 */

const config = {
    name: "VV-Chat",
    port: 3000,
    https: true,
    sessionSecret: 'chattyPatty',
    usersFile: "src/users.json",
    roomsFile: "src/rooms.json",
    defaultRoom: {
        id: "landing",
        name: "Main",
        icon: "0x1f47e" // all icons in /src/static/js/emoji.json
    },
    certificateFiles: {
        cert: 'server.crt',
        ca: 'server.csr',
        priv: 'server.key'
    }
}


/* Docker SSL cert settings */
if (process.env.DOCKER) {
    config.roomsFile = '/app/input/rooms.json';
    config.usersFile = '/app/input/users.json';
    config.certificateFiles = {
        cert: '/app/input/cert.pem',
        ca: '/app/input/chain.pem',
        priv: '/app/input/privkey.pem',
    }
}


module.exports = config;