/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */


const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt-nodejs');
const config = require('./src/config');
const server = require('./src/server');
const randomString = require('./src/randomString');

/* 
 * Checking if users file exists 
 */
if (!fs.existsSync(config.usersFile)) {
    console.log(`${config.usersFile} not found, creating`);
    const password = randomString();
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt)
    fs.writeFileSync(config.usersFile, JSON.stringify({
        users: [{
            username: "root",
            password: hash,
            first: false,
            clientId: randomString(22)
        }]
    }));
    console.log(`Created file:  ${config.usersFile}`);
    console.log(`---- Management account - name ----\n`);
    console.log("\troot\n");
    console.log(`---- Management account - password ----\n`);
    console.log(`\t${password}\n`);
}

/* 
 * Checking if rooms file exists 
 */
if (!fs.existsSync(config.roomsFile)) {
    console.log(`${config.roomsFile} not found, creating.`);
    fs.writeFileSync(config.roomsFile, JSON.stringify({
        list: [{
            id: config.defaultRoom.id,
            name: config.defaultRoom.name,
            icon: config.defaultRoom.icon
        }]
    }));
}



/* 
 * Starting server
 */
server.listen(config.port, (e) => {
    if (e) {
        console.log(e);
        return process.exit(1);
    } else {
        console.log(`### (${config.https?"HTTPS":"HTTP"}) ${config.name} listening on port ${config.port} ###`);
    }
});