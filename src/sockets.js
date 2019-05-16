/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

const fs = require('fs');
const sharedsession = require('express-socket.io-session');
const config = require('./config');
const Store = require('./Store');
const session = require('./sessions');
const randomString = require('./randomString');
const fileManip = require('./fileManip');

/*
 * Return date
 * @param ${raw} returns unix type date
 */
const getTime = (raw) => raw ? new Date(new Date().now() - (new Date().getTimezoneOffset() * 60000)) : new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');


module.exports = function(io) {

    /* 
     * Allow socket.io use session
     */
    io.of('/chat').use(sharedsession(session, { autoSave: true }));

    /* 
     * Socket.io 
     */
    io.of('/chat').on('connection', function(socket) {
        let activeRoom = config.defaultRoom.id;

        /* 
         * Check if user is authorized
         */
        function checkSession() {
            return typeof socket.handshake.session !== 'undefined' && socket.handshake.session.valid ? true : false;
        }
        /* Kick user if not authorized */
        function notAuthorized(socket) {
            socket.emit('invalidSession', true);
            socket.leave(activeRoom);
        }

        /* 
         * Get active sessions matching clientId
         */
        function activeSessions(clientId) {
            return new Promise(function(resolve) {
                /* Getting all sessions */
                Store.list(function(el, list) {
                    if (list) {
                        /* Getting sessions matching clientId */
                        list = list.map((el) => {
                            let active = JSON.parse(fs.readFileSync(__dirname + '/../sessions/' + el, 'utf-8'));
                            if (active.clientId == clientId)
                                return {
                                    clientId: active.clientId,
                                    socketId: active.socketId,
                                    os: active.os,
                                    user: active.user,
                                    lastAccess: getTime(),
                                    status: true
                                };
                            else
                                return null;
                        });
                        /* Deleting sessions that haven't got socketId set */
                        list = list.filter((el) => {
                            return typeof el !== 'undefined' && el != null && el.socketId;
                        });
                        resolve(list);
                    } else {
                        resolve([]);
                    }
                });
            });
        }


        /* 
         * Updating session
         */
        if (checkSession()) {
            socket.handshake.session.socketId = socket.id;
            socket.clientId = socket.handshake.session.clientId;
            socket.user = socket.handshake.session.user;
            socket.handshake.session.save();
            // socket.join(room);
        } else {
            notAuthorized(socket);
        }


        /* 
         * Notify users when client connects/disconnects
         */
        socket.on('userConnected', function socket_userConnected(wRoom) {
            if (checkSession()) {
                /* Leaving all rooms */
                socket.leaveAll();
                /* Check if user provided room id */

                fileManip.getRoom(wRoom, room => {
                    let id, name, icon;
                    if (room) {
                        /* Get room matching id */
                        id = room.id;
                        name = room.name;
                        icon = room.icon;
                    } else {
                        /* Set room details to default if id provided by user was not found */
                        id = config.defaultRoom.id;
                        name = config.defaultRoom.name;
                        icon = config.defaultRoom.icon;
                    }
                    /* Update user's active room */
                    activeRoom = id;
                    socket.join(id);

                    /* Get users in activeRoom */
                    io.of('/chat').in(activeRoom).clients((error, clients) => {
                        if (!error) {
                            /* Notify users */
                            socket.nsp.to(`${activeRoom}`).emit('userConnected', {
                                status: true,
                                joined: socket.handshake.session.clientId,
                                username: socket.handshake.session.user,
                                time: getTime(),
                                users: clients.length,
                                roomName: name,
                                roomIcon: icon,
                                rid: id
                            });

                            /* 
                             * Update active sessions for clientId
                             */
                            activeSessions(socket.handshake.session.clientId).then((list) => {
                                for (let i = 0; i < list.length; i++) {
                                    io.of('/chat').to(`${list[i].socketId}`).emit('activeSessions', list);
                                }
                            });

                        } else {
                            console.log(`Failed to get active clients in "${id}:${name}" - description:\n ${error}`);
                        }
                    });
                });

            } else {
                notAuthorized(socket);
            }
        });


        /* 
         * Load active sessions for clientId
         */
        socket.on('activeSessions', function socket_activeSessions(user, fn) {
            if (checkSession()) {
                /* Get active user sessions */
                activeSessions(socket.handshake.session.clientId).then((list) => {
                    fn(list);
                });
            }
        });


        /* 
         * User can log out devices on which he's logged in
         */
        socket.on('removeSession', function socket_removeSession(s, fn) {
            if (checkSession()) {
                const clientId = socket.handshake.session.clientId;
                /* Get sessions id from Store */
                Store.list(function(opt, list) {
                    list = list.map((el) => {
                        /* Read session file matching id */
                        let active = JSON.parse(fs.readFileSync(__dirname + '/../sessions/' + el, 'utf-8'));

                        if (active.clientId == clientId && active.socketId == s) {
                            /* Destroy session matching clientId and socketId */
                            Store.destroy(el.substring(0, el.indexOf('.json')), (err) => {
                                if (err != null)
                                    console.log('ERROR: Session already destroyed, description:\n' + err);
                                /* Send logout message to deleted session */
                                io.of('/chat').to(`${s}`).volatile.emit('invalidSession', true);
                            });
                        } else {
                            if (active.clientId == clientId)
                                return {
                                    clientId: active.clientId,
                                    socketId: active.socketId,
                                    os: active.os,
                                    user: active.user,
                                    lastAccess: new Date(new Date(active.__lastAccess).getTime() - (new Date(active.__lastAccess).getTimezoneOffset() * 60000)).toJSON().substring(0, 19).replace('T', ' ')
                                };
                            else
                                return null;
                        }
                    });
                    list = list.filter((el) => {
                        return typeof el !== 'undefined' && el != null && el.socketId;
                    });

                    /* Return updated session list */
                    fn(list);
                });
            }
        });


        /* 
         * Sending/Receiving text messages
         */
        socket.on('message', function socket_message(data) {
            if (checkSession()) {
                const { message, mid } = data;
                if (message != '' && message.length > 0)
                    socket.to(`${activeRoom}`).emit('message', {
                        username: socket.handshake.session.user,
                        message: message,
                        time: getTime(),
                        mid: mid
                    });
            } else {
                notAuthorized(socket);
            }
        });


        /* 
         * Sending/Receiving images
         */
        socket.on('image', function socket_image(image, fn) {
            if (checkSession()) {
                const { type, name, blob, mid } = image;
                if (type.indexOf('image') >= 0) {
                    socket.to(`${activeRoom}`).emit('image', {
                        username: socket.handshake.session.user,
                        name: name ? name : randomString(8),
                        type: type,
                        time: getTime(),
                        img: blob,
                        mid: mid
                    });
                    /* Notify user when image was sent */
                    fn(true);
                }
            } else {
                notAuthorized(socket);
            }
        });


        /* 
         * Deleting sent messages
         */
        socket.on('reverseMessage', function socket_reverseMessage(mid) {
            if (checkSession()) {
                /* Check if user owns message that will be removed */
                if (mid.indexOf(socket.handshake.session.clientId) > 0) {
                    socket.nsp.to(`${activeRoom}`).emit('reverseMessage', mid);
                }
            } else {
                notAuthorized(socket);
            }
        });


        /* 
         * Notify users when someones typing
         *
         * THIS WILL BE CHANGED IN THE FUTURE
         * ::TODO
         */
        socket.on('typing', function socket_typing(user) {
            if (checkSession()) {
                socket.to(`${activeRoom}`).emit('typing', user);
            }
        });


        /* 
         * NOT IMPLEMENTED YET
         * ::TODO
         */
        socket.on('read', function socket_read(user) {
            if (checkSession()) {
                socket.to(`${activeRoom}`).emit('read', user);
            } else {
                notAuthorized(socket);
            }
        });


        /* 
         * Listing avialable chat rooms
         */
        socket.on('roomList', function socket_roomList() {
            if (checkSession()) {
                /* Get all rooms, without sensitive informations */
                fileManip.readRooms(true, (err, rooms) => {
                    if (!err) {
                        rooms.list = rooms.list.filter(el => {
                            el.online = 0;
                            return el;
                        });
                        /* Initiate promises array */
                        let clientsLength = [];

                        for (let i = 0; i < rooms.list.length; i++) {
                            /* Push promise to the array */
                            clientsLength.push(new Promise((res) => {
                                io.of('/chat').in(rooms.list[i].id).clients((error, clients) => {
                                    rooms.list[i].online = clients.length;
                                    res();
                                });
                            }));

                        }
                        /* Sent rooms to users when all active users has been counted */
                        Promise.all(clientsLength).then(() => {
                            io.of('/chat').emit('roomList', rooms.list);
                            /* Clear the array */
                            clientsLength = [];
                        });
                    }
                });
            } else {
                notAuthorized(socket);
            }
        });


        /* 
         * Changing active room
         */
        socket.on('changeRoom', function socket_changeRoom(wRoom, fn) {
            if (checkSession()) {
                let icon, name, id;
                /* Get specific room */
                fileManip.getRoom(wRoom, (data) => {
                    /* If room wan not found data will be false */
                    if (data) {
                        id = data.id;
                        name = data.name;
                        icon = data.icon;
                    } else {
                        id = config.defaultRoom.id;
                        name = config.defaultRoom.name;
                        icon = config.defaultRoom.icon;
                    }
                    /* Update if requested room was found */
                    if (id == wRoom) {
                        io.of('/chat').in(activeRoom).clients((error, clients) => {
                            /* Notify clients when user leave */
                            socket.nsp.to(`${activeRoom}`).emit('userConnected', {
                                status: false,
                                joined: socket.handshake.session.clientId,
                                username: socket.handshake.session.user,
                                time: getTime(),
                                users: clients.length - 1
                            });
                            /* Leave all rooms */
                            socket.leaveAll();
                            /* Update active room and join */
                            activeRoom = id;
                            socket.join(activeRoom);

                            /* Notify users about new user in room */
                            io.of('/chat').in(activeRoom).clients((error, clients) => {
                                socket.nsp.to(`${activeRoom}`).emit('userConnected', {
                                    status: true,
                                    joined: socket.handshake.session.clientId,
                                    username: socket.handshake.session.user,
                                    time: getTime(),
                                    users: clients.length
                                });
                            });
                        });
                    }
                    /* Sent room information when request was successfull */
                    fn({
                        id: id,
                        name: name,
                        icon: icon,
                    });
                });
            }
        });


        /* 
         * Add rooms
         */
        socket.on('addRoom', function socket_addRoom(newRoom, fn) {
            if (checkSession()) {
                if (socket.handshake.session.auth == 'root' || socket.handshake.session.auth == 'mod') {
                    /* Room name format */
                    const format = /^[a-zA-Z0-9@!.\-\sAaĄąĆćĘęŁłŃńÓóSsŚśŹźŻż]+$/;
                    /* Get all rooms */
                    fileManip.readRooms(false, (err, data) => {
                        if (!err) {
                            let { name, icon } = newRoom;

                            /* Set random icon if not set */
                            icon = icon ? icon : JSON.parse(fs.readFileSync(__dirname + '/static/js/emoji.json', 'utf-8')).list[Math.floor(Math.random() * 813)];
                            /* Test room name */
                            if (format.test(name) && name.length <= 30) {
                                /* Create room object */
                                const createRoom = {
                                    id: randomString(10),
                                    name: name,
                                    icon: icon,
                                    password: {
                                        required: false,
                                        hash: ''
                                    }
                                };

                                /* Add new room to the list */
                                data.list.push(createRoom);

                                /* Write changes */
                                fileManip.writeRooms(data, (w_err) => {
                                    if (!w_err) {
                                        /* Send room details to user */
                                        fn({
                                            status: true,
                                            id: createRoom.id,
                                            name: name,
                                            icon: icon
                                        });

                                        /* Initiate promises array */
                                        let clientsLength = [];

                                        for (let i = 0; i < data.list.length; i++) {
                                            /* Push promise to the array */
                                            clientsLength.push(new Promise((res) => {
                                                io.of('/chat').in(data.list[i].id).clients((error, clients) => {
                                                    data.list[i].online = clients.length;
                                                    res();
                                                });
                                            }));

                                        }
                                        /* Sent rooms to users when all active users has been counted */
                                        Promise.all(clientsLength).then(() => {
                                            io.of('/chat').emit('roomList', data.list);
                                            /* Clear the array */
                                            clientsLength = [];
                                        });
                                    } else {
                                        console.log(`Error: Couldn't write to: ${config.roomsFile} - description:\n ${w_err}`);
                                    }

                                });

                            }

                        } else {
                            console.log(`Error: Couldn't read: ${config.roomsFile}`);
                            fn({
                                status: false,
                                message: 'Name not satisfying requirements'
                            });
                        }
                    });
                }
            }
        });


        /* 
         * Delete rooms
         */
        socket.on('deleteRoom', function socket_deleteRoom(roomToDelete) {
            if (checkSession()) {
                if (socket.handshake.session.auth == 'root' || socket.handshake.session.auth == 'mod') {
                    fileManip.readRooms(false, (err, data) => {
                        if (roomToDelete != config.defaultRoom.id) {
                            data.list = data.list.filter(el => {
                                return el.id != roomToDelete;
                            });
                            fileManip.writeRooms(data, err => {
                                if (!err) {

                                    io.of('/chat').to(roomToDelete).emit('changeRoom', config.defaultRoom.id);

                                    let clientsLength = [];

                                    for (let i = 0; i < data.list.length; i++) {
                                        /* Push promise to the array */
                                        clientsLength.push(new Promise((res) => {
                                            io.of('/chat').in(data.list[i].id).clients((error, clients) => {
                                                data.list[i].online = clients.length;
                                                res();
                                            });
                                        }));

                                    }
                                    /* Sent rooms to users when all active users has been counted */
                                    Promise.all(clientsLength).then(() => {
                                        io.of('/chat').emit('roomList', data.list);
                                        /* Clear the array */
                                        clientsLength = [];
                                    });

                                } else {
                                    console.log(`ERROR: Couldn't write changes to ${config.roomsFile}, description\n ${err}`);
                                }
                            });
                        }
                    });
                }
            }
        });


        /* 
         * Socket disconnect event, notifying users when user left
         */
        socket.on('disconnect', function socket_disconnect() {
            if (checkSession()) {
                io.of('/chat').in(activeRoom).clients((error, clients) => {
                    if (socket.clientId != 'root')
                        socket.nsp.to(`${activeRoom}`).emit('userConnected', {
                            status: false,
                            joined: socket.handshake.session.clientId,
                            username: socket.handshake.session.user,
                            time: getTime(),
                            users: clients.length
                        });
                });
                activeSessions(socket.handshake.session.clientId).then((list) => {
                    for (let i = 0; i < list.length; i++) {
                        io.of('/chat').to(`${list[i].socketId}`).emit('activeSessions', list);
                    }
                });
            }
        });
    });
};