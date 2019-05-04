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

/*
 * Return date
 * @param raw returns unix type date
 */
const getTime = (raw) => raw ? new Date(new Date().now() - (new Date().getTimezoneOffset() * 60000)) : new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');


module.exports = function(io) {

    /* 
     * Allow socket.io use session
     */
    io.of("/chat").use(sharedsession(session, { autoSave: true }));

    /* 
     * Socket.io 
     */
    io.of('/chat').on('connection', function(socket) {
        let room = config.defaultRoom.name;

        /* 
         * Check if user is authorized
         */
        function checkSession() {
            return typeof socket.handshake.session !== undefined && socket.handshake.session.valid ? true : false;
        }


        /* 
         * Get active sessions matching clientId
         */
        function activeSessions(clientId) {
            return new Promise(function(resolve, reject) {
                Store.list(function(el, list) {
                    list = list.map((el) => {
                        let active = JSON.parse(fs.readFileSync(__dirname + "/../sessions/" + el, 'utf-8'));
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
                    list = list.filter((el) => {
                        return typeof el !== undefined && el != null && el.socketId;
                    });
                    if (list.length > 0)
                        resolve(list);
                });
            });
        }


        /* 
         * Updating session
         */
        if (checkSession()) {
            socket.handshake.session.socketId = socket.id;
            socket.handshake.session.save();
            // socket.join(room);
        }


        /* 
         * Notify users when client connects/disconnects
         */
        socket.on("userConnected", function socket_userConnected(wRoom) {
            if (checkSession()) {
                let roomIcon, rid;
                /* Leaving all rooms */
                socket.leaveAll();
                /* Check if user provided room id */
                nRoom = wRoom ? wRoom : config.defaultRoom.id;

                roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8")).list;

                /* Get room matching id */
                roomList = roomList.filter(el => {
                    if (el.id == nRoom) {
                        roomName = el.name;
                        roomIcon = el.icon;
                        rid = el.id
                        return el;
                    }
                });

                /* Set room details to default if id provided by user was not found */
                if (roomList.length == 0) {
                    roomName = config.defaultRoom.name;
                    rid = config.defaultRoom.id;
                    roomIcon = config.defaultRoom.icon;
                }

                /* Update user's active room */
                room = rid;
                socket.join(room);

                /* Get users in room */
                io.of('/chat').in(room).clients((error, clients) => {
                    /* Notify users */
                    socket.to(`${room}`).emit("userConnected", {
                        status: true,
                        self: false,
                        username: socket.handshake.session.user,
                        time: getTime(),
                        users: clients.length,
                        roomName: roomName,
                        roomIcon: roomIcon,
                        rid: rid
                    });

                    /* Send details to user */
                    socket.emit("userConnected", {
                        status: true,
                        self: true,
                        username: socket.handshake.session.user,
                        time: getTime(),
                        users: clients.length,
                        roomName: roomName,
                        roomIcon: roomIcon,
                        rid: rid
                    });
                });

                /* 
                 * Update active sessions for clientId
                 */
                activeSessions(socket.handshake.session.clientId).then((list) => {
                    for (let i = 0; i < list.length; i++) {
                        io.of('/chat').to(`${list[i].socketId}`).emit("activeSessions", list);
                    }
                });

            } else {
                socket.leave(room);
                socket.emit("invalidSession", true);
            }
        });


        /* 
         * Load active sessions for clientId
         */
        socket.on("activeSessions", function socket_activeSessions(user, fn) {
            if (checkSession()) {
                activeSessions(socket.handshake.session.clientId).then((list) => {
                    fn(list);
                });
            }
        });


        /* 
         * User can log out devices on which he's logged in
         */
        socket.on("removeSession", function socket_removeSession(s, fn) {
            if (checkSession()) {
                const clientId = socket.handshake.session.clientId;
                /* Get sessions id from Store */
                Store.list(function(opt, list) {
                    list = list.map((el) => {
                        /* Read session file matching id */
                        let active = JSON.parse(fs.readFileSync(__dirname + "/../sessions/" + el, 'utf-8'));

                        if (active.clientId == clientId && active.socketId == s) {
                            /* Destroy session matching clientId and socketId */
                            Store.destroy(el.substring(0, el.indexOf(".json")), (err) => {
                                if (err != null)
                                    console.log("ERROR: Session already destroyed, description:\n" + err);
                                /* Send logout message to deleted session */
                                io.of("/chat").to(`${s}`).volatile.emit("invalidSession", true);
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
                        return typeof el !== undefined && el != null && el.socketId;
                    });

                    /* Return updated session list */
                    fn(list);
                });
            }
        });


        /* 
         * Sending/Receiving text messages
         */
        socket.on("message", function socket_message(data) {
            if (checkSession()) {
                if (data.message != "" && data.message.length > 0)
                    socket.to(`${room}`).emit("message", {
                        username: socket.handshake.session.user,
                        message: data.message,
                        time: getTime(),
                        mid: data.mid
                    });
            } else {
                socket.leave(room);
                socket.emit("invalidSession", true);
            }
        });


        /* 
         * Sending/Receiving images
         */
        socket.on("image", function socket_image(image, fn) {
            if (checkSession()) {
                if (image.type.indexOf("image") >= 0) {
                    socket.to(`${room}`).emit("image", {
                        username: socket.handshake.session.user,
                        name: image.name ? image.name : randomString(8),
                        type: image.type,
                        time: getTime(),
                        img: image.blob,
                        mid: image.mid
                    });
                    fn(true);
                }
            } else {
                socket.leave(room);
                socket.emit("invalidSession", true);
            }
        });


        /* 
         * Deleting sent messages
         */
        socket.on("reverseMessage", function socket_reverseMessage(mid) {
            if (checkSession()) {
                if (mid.indexOf(socket.handshake.session.clientId) > 0) {
                    socket.nsp.to(`${room}`).emit("reverseMessage", mid);
                }
            } else {
                socket.leave(room);
                socket.emit("invalidSession", true);
            }
        });


        /* 
         * Notify users when someones typing
         */
        socket.on("typing", function socket_typing(user) {
            if (checkSession()) {
                socket.to(`${room}`).emit("typing", user);
            }
        });


        /* 
         * Not yet implemented
         */
        socket.on("read", function socket_read(user) {
            if (checkSession()) {
                socket.to(`${room}`).emit("read", user);
            } else {
                socket.leave(room);
                socket.emit("invalidSession", true);
            }
        });


        /* 
         * Listing avialable chat rooms
         */
        socket.on("roomList", function socket_roomList() {
            if (checkSession()) {
                let roomList = fs.readFileSync(config.roomsFile, "utf-8");
                if (roomList) {
                    roomList = JSON.parse(roomList).list.filter(el => {
                        return {
                            id: el.id,
                            name: el.name,
                            icon: el.icon,
                            online: 0
                        }
                    });
                    let clientsLength = [];
                    for (let i = 0; i < roomList.length; i++) {
                        clientsLength.push(new Promise((res, rej) => {
                            io.of('/chat').in(roomList[i].id).clients((error, clients) => {
                                delete roomList[i].password;
                                roomList[i].online = clients.length;
                                res();
                            });
                        }));
                    }
                    Promise.all(clientsLength).then(() => {
                        io.of("/chat").emit("roomList", roomList);
                        clientsLength = [];
                    });
                }
            } else {
                socket.leave(room);
                socket.emit("invalidSession", true);
            }
        });


        /* 
         * Changing active room
         */
        socket.on("changeRoom", function socket_changeRoom(wRoom, fn) {
            if (checkSession()) {
                nRoom = wRoom ? wRoom : config.defaultRoom.id;
                roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8")).list;
                roomList = roomList.filter(el => {
                    if (el.id == nRoom) {
                        roomName = el.name;
                        roomIcon = el.icon;
                        rid = el.id
                        return el;
                    }
                });
                if (roomList.length == 0) {
                    roomName = config.defaultRoom.name;
                    rid = config.defaultRoom.id;
                    roomIcon = config.defaultRoom.icon;
                }
                if (rid == wRoom) {
                    io.of('/chat').in(room).clients((error, clients) => {
                        socket.to(`${room}`).emit("userConnected", {
                            status: false,
                            self: false,
                            username: socket.handshake.session.user,
                            time: getTime(),
                            users: clients.length - 1
                        });

                        socket.leaveAll();
                        room = rid;
                        socket.join(room);

                        io.of('/chat').in(room).clients((error, clients) => {
                            socket.to(`${room}`).emit("userConnected", {
                                status: true,
                                self: false,
                                username: socket.handshake.session.user,
                                time: getTime(),
                                users: clients.length
                            });
                            socket.emit("userConnected", {
                                status: true,
                                self: true,
                                username: socket.handshake.session.user,
                                time: getTime(),
                                users: clients.length
                            });
                        });
                    });
                }
                fn({
                    id: rid,
                    name: roomName,
                    icon: roomIcon,
                })
            }
        });


        /* 
         * Add rooms
         */
        socket.on("addRoom", function socket_addRoom(newRoom, fn) {
            if (checkSession()) {
                if (socket.handshake.session.auth == "root" || socket.handshake.session.auth == "mod") {
                    cRoom = newRoom;
                    let roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8"));
                    const format = /^[a-zA-Z0-9@!\.\-\sAaĄąĆćĘęŁłŃńÓóSsŚśŹźŻż]+$/;
                    if (roomList) {
                        if (format.test(cRoom.name) && cRoom.name.length <= 30) {
                            cRoom.icon = cRoom.icon ? cRoom.icon : JSON.parse(fs.readFileSync(__dirname + "/static/js/emoji.json", "utf-8")).list[Math.floor(Math.random() * 813)];
                            const newRoom = {
                                id: randomString(10),
                                name: cRoom.name,
                                icon: cRoom.icon,
                                password: {
                                    required: false,
                                    hash: ""
                                }
                            };
                            roomList.list.push(newRoom);
                            fs.writeFile(config.roomsFile, JSON.stringify(roomList), (err) => {
                                if (!err) {
                                    fn({
                                        status: true,
                                        id: cRoom.id,
                                        name: cRoom.name,
                                        icon: cRoom.icon
                                    });
                                    let clientsLength = [];
                                    for (let i = 0; i < roomList.list.length; i++) {
                                        clientsLength.push(new Promise((res, rej) => {
                                            io.of('/chat').in(roomList.list[i].id).clients((error, clients) => {
                                                roomList.list[i].online = clients.length;
                                                res();
                                            });
                                        }));
                                    }
                                    Promise.all(clientsLength).then(() => {
                                        io.of("/chat").emit("roomList", roomList.list);
                                        clientsLength = [];
                                    });
                                }
                            });
                        } else {
                            fn({
                                status: false,
                                message: "Name not satisfying requirements"
                            });
                        }
                    } else {
                        console.log(`Error: Couldn't read: ${config.roomsFile}`);
                    }
                } else {
                    fn({
                        status: false,
                        message: "Not authorized"
                    });
                }
            }
        });


        /* 
         * Delete rooms
         */
        socket.on("deleteRoom", function socket_deleteRoom(rid) {
            if (checkSession()) {
                if (socket.handshake.session.auth == "root" || socket.handshake.session.auth == "mod") {
                    let roomList = JSON.parse(fs.readFileSync(config.roomsFile, "utf-8"));
                    if (rid != config.defaultRoom.id) {
                        roomList.list = roomList.list.filter(el => {
                            return el.id != rid;
                        });
                    }
                    fs.writeFile(config.roomsFile, JSON.stringify(roomList), (err) => {
                        if (!err) {
                            io.of("/chat").to(rid).emit("changeRoom", config.defaultRoom.id);
                            let clientsLength = [];
                            for (let i = 0; i < roomList.list.length; i++) {
                                clientsLength.push(new Promise((res, rej) => {
                                    io.of('/chat').in(roomList.list[i].id).clients((error, clients) => {
                                        roomList.list[i].online = clients.length;
                                        res();
                                    });
                                }));
                            }
                            Promise.all(clientsLength).then(() => {
                                io.of("/chat").emit("roomList", roomList.list);
                                clientsLength = [];
                            });
                        } else {
                            console.log(`ERROR: Couldn't write changes to ${config.roomsFile}, description\n ${err}`);
                        }
                    });
                }
            }
        });


        /* 
         * Socket disconnect event, notifying users when user left
         */
        socket.on("disconnect", function socket_disconnect() {
            if (checkSession()) {
                io.of('/chat').in(room).clients((error, clients) => {
                    socket.nsp.to(`${room}`).emit("userConnected", {
                        status: false,
                        self: false,
                        username: socket.handshake.session.user,
                        time: getTime(),
                        users: clients.length
                    });
                });
                activeSessions(socket.handshake.session.clientId).then((list) => {
                    for (let i = 0; i < list.length; i++) {
                        io.of('/chat').to(`${list[i].socketId}`).emit("activeSessions", list);
                    }
                });
            }
        });
    });
};