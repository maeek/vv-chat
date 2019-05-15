/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 *   Change settings for your own needs
 * 
 */

const fs = require('fs');
const bcrypt = require('bcryptjs');
const randomString = require('./randomString');


const config = {
    name: 'VV-Chat',
    port: 3000,
    https: true,
    sessionSecret: 'chattyPatty',
    usersFile: 'src/users.json',
    roomsFile: 'src/rooms.json',
    defaultRoom: {
        id: 'landing',
        name: 'Main',
        icon: '0x1f47e' // Icons in /src/static/js/emoji.json
    },
    certificateFiles: {
        cert: 'server.crt',
        ca: 'server.csr',
        priv: 'server.key'
    }
};


/* Docker SSL cert settings */
if (process.env.DOCKER) {
    config.roomsFile = '/app/input/rooms.json';
    config.usersFile = '/app/input/users.json';
    config.certificateFiles = {
        cert: '/app/input/cert.pem',
        ca: '/app/input/chain.pem',
        priv: '/app/input/privkey.pem',
    };
}

/* 
 * Checking if users file exists 
 */
if (fs.existsSync(config.usersFile)) {

    /* Check users file structure */
    let usersFile = fs.readFileSync(config.usersFile, 'utf-8');
    usersFile = JSON.parse(usersFile);
    if (Object.keys(usersFile)[0] == 'users') {
        for (let i = 0; i < usersFile.users.length; i++) {
            const keys = Object.keys(usersFile.users[i]);
            if (keys.indexOf('username') == -1) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "username".`);
            }

            if (keys.indexOf('password') == -1) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "password".`);
            }

            if (keys.indexOf('first') == -1) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "first", fixing.`);
                usersFile.users[i].first = true;
            }

            if (keys.indexOf('clientId') == -1) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "clientId", fixing.`);
                usersFile.users[i].clientId = randomString(22);
            }

            if (keys.indexOf('blocked') == -1) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "blocked", fixing.`);
                usersFile.users[i].blocked = false;
            }
        }
        fs.writeFileSync(config.usersFile, JSON.stringify(usersFile));
    } else {
        console.log(`ERROR: Invalid ${config.roomsFile} file structure. Fix the problem or create new file.`);
        process.exit(1);
    }
} else {
    console.log(`${config.usersFile} not found, creating`);
    const password = randomString();
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);
    fs.writeFileSync(config.usersFile, JSON.stringify({
        users: [{
            username: 'root',
            password: hash,
            first: false,
            clientId: 'root'
        }]
    }));
    console.log(`Created file:  ${config.usersFile}`);
    console.log('---- Management account - name ----\n');
    console.log('\troot\n');
    console.log('---- Management account - password ----\n');
    console.log(`\t${password}\n`);
}


/* 
 * Checking if rooms file exists 
 */
if (fs.existsSync(config.roomsFile)) {
    let roomsFile = fs.readFileSync(config.roomsFile, 'utf-8');
    roomsFile = JSON.parse(roomsFile);
    if (Object.keys(roomsFile)[0] == 'list') {
        for (let i = 0; i < roomsFile.list.length; i++) {
            const keys = Object.keys(roomsFile.list[i]);
            if (keys.indexOf('name') == -1) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "name".`);
            }

            if (keys.indexOf('icon') == -1 || roomsFile.list[i].icon == null) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "icon", fixing`);
                roomsFile.list[i].icon = '0x1f44d';
            }

            if (keys.indexOf('password') == -1) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "password", fixing.`);
                roomsFile.list[i].password = {
                    required: false,
                    hash: ''
                };
            }

            if (keys.indexOf('id') == -1) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "id", fixing.`);
                roomsFile.list[i].clientId = randomString(22);
            }
        }
        fs.writeFileSync(config.roomsFile, JSON.stringify(roomsFile));
    } else {
        console.log(`ERROR: Invalid ${config.roomsFile} file structure. Fix the problem or create new file.`);
        process.exit(1);
    }
} else {
    console.log(`${config.roomsFile} not found, creating.`);
    fs.writeFileSync(config.roomsFile, JSON.stringify({
        list: [{
            id: config.defaultRoom.id,
            name: config.defaultRoom.name,
            icon: config.defaultRoom.icon,
            password: { // Not yet implemented
                required: false,
                hash: ''
            }
        }]
    }));
}


module.exports = config;