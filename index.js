/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */


const config = require('./src/config');
const server = require('./src/server');


/* 
 * Starting server
 */
server.listen(config.port, (e) => {
    if (e) {
        console.log(e);
        return process.exit(1);
    } else {
        console.log(`### (${config.https?'HTTPS':'HTTP'}) ${config.name} listening on port ${config.port} ###`);
    }
});