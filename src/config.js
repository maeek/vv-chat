/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
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
        icon: '😍' // Icons in /src/static/js/emoji.json
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
            if (!keys.includes('username')) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "username".`);
            }

            if (!keys.includes('password')) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "password".`);
            }

            if (!keys.includes('first')) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "first", fixing.`);
                usersFile.users[i].first = true;
            }

            if (!keys.includes('clientId')) {
                console.log(`WARNING: file ${config.usersFile} is broken. Object: ${JSON.stringify(usersFile.users[i])} is missing "clientId", fixing.`);
                usersFile.users[i].clientId = randomString(22);
            }

            if (usersFile.users[0].clientId != '_root_' && usersFile.users[0].username == 'root') {
                usersFile.users[0].clientId = '_root_';
            }

            if (usersFile.users[0].clientId != '_root_' && usersFile.users[0].username == 'root') {
                usersFile.users[0].clientId = '_root_';
            }

            if (!keys.includes('blocked')) {
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
            clientId: '_root_',
            blocked: false
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

/* Due to changed emojis the config.roomsFile must be removed or changed */



if (fs.existsSync(config.roomsFile)) {
    let roomsFile = fs.readFileSync(config.roomsFile, 'utf-8');
    roomsFile = JSON.parse(roomsFile);
    if (Object.keys(roomsFile)[0] == 'list') {
        for (let i = 0; i < roomsFile.list.length; i++) {
            const keys = Object.keys(roomsFile.list[i]);

            if (!keys.includes('name')) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "name".`);
            }

            if (!keys.includes('icon') || roomsFile.list[i].icon == null || roomsFile.list[i].icon.indexOf('0x') >= 0) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "icon", fixing`);
                roomsFile.list[i].icon = '🚨';
            }

            if (!keys.includes('password')) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "password", fixing.`);
                roomsFile.list[i].password = {
                    required: false,
                    hash: '',
                    authorized: []
                };
            }

            if (!keys.includes('permissions')) {
                roomsFile.list[i].permissions = {
                    maxUsers: 0,
                    mod: null
                };
            }

            /* Clean for previous commit */
            if (!keys.includes('clientId') >= 0) {
                delete roomsFile.list[i].clientId;
            }

            if (!keys.includes('id')) {
                console.log(`WARNING: file ${config.roomsFile} is broken. Object: ${JSON.stringify(roomsFile.list[i])} is missing "id", fixing.`);
                if (roomsFile.list[i].name != config.defaultRoom.name)
                    roomsFile.list[i].id = randomString(22);
                else
                    roomsFile.list[i].id = config.defaultRoom.id;
            }
        }
        fs.writeFileSync(config.roomsFile, JSON.stringify(roomsFile));

        if (JSON.parse(fs.readFileSync(config.roomsFile, 'utf-8')).list[0].icon.indexOf('0x') != -1) {
            fs.unlinkSync(config.roomsFile);
            console.log(`Due to changes in version 1.1.1 ${config.roomsFile} must be removed.`);
        }

    } else {
        console.log(`ERROR: Invalid ${config.roomsFile} file structure. Fix the problem or create new file.`);
        process.exit(1);
    }
    config.defaultRoom.icon = roomsFile.list.find(el => el.id == 'landing').icon;
    config.defaultRoom.name = roomsFile.list.find(el => el.id == 'landing').name;
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
            },
            permissions: {
                maxUsers: 0,
                mod: null
            }
        }]
    }));
}


module.exports = config;