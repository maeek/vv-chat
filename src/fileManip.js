/* eslint-disable no-console */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

const fs = require('fs');
const config = require('./config');

const fileManip = {
    readUsers: function(stripSensitive, callback) {
        /*
         * Read users list from file 
         */
        
        fs.readFile(config.usersFile, 'utf-8', (err, data)=>{
            if(!err) {
                /* Parse Data */
                data = JSON.parse(data);
                /* Delete sensitive information */
                if(stripSensitive){
                    for (let i = 0; i < data.users.length; i++) {
                        delete data.users[i].password;
                        delete data.users[i].first;
                    }
                    /* Don't return root */
                    data.users = data.users.filter(el => {
                        return el.username != 'root';
                    });
                }
            }
            /* Execute callback */
            callback.call(this, err, data);
        });
    },    
    writeUsers: function(data, callback) {
        /*
         * Write data to users file
         */
        
        /* Check given data */
        if(data && typeof data === 'object' && data.users.length > 1){
            /* Prepare data */
            data = JSON.stringify(data);
            /* Write data */
            fs.writeFile(config.usersFile, data, (err)=>{
                if(err)
                    console.log(`ERROR: Failed to write data to ${config.usersFile} - description:\n ${err}`);
                /* Execute callback */
                callback.call(this, err);
            });
        }
    },
    getUser: function(clientId, callback) {
        /*
         * Get user data
         */
        if(typeof clientId === 'string'){
            const $fileManip = this;
            $fileManip.readUsers(false, (err, data)=>{
                if(!err){
                    data.users = data.users.filter(el=>{
                        return el.clientId == clientId;
                    });
                    callback(this, data);
                } else {
                    console.log(`Failed to get user information, description:\n ${err}`);
                }  
            });
        }
    },
    readRooms: function(stripSensitive, callback) {
        /*
         * Read rooms file
         */
        
        fs.readFile(config.roomsFile, 'utf-8', (err, data)=>{
            if(!err) {
                /* Parse Data */
                data = JSON.parse(data);
                /* Delete sensitive information */
                if(stripSensitive){
                    for (let i = 0; i < data.list.length; i++) {
                        delete data.list[i].password;
                    }
                }
                /* Execute callback */
                callback.call(this, err, data);
            }
        });
    },
    writeRooms: function(data, callback){
        /*
         * Write data to users file
         */
        
        /* Check given data */
        if(typeof data === 'object' && data.list.length > 1){
            
            /* Prepare data */
            data = JSON.stringify(data);
            
            /* Write data */
            fs.writeFile(config.roomsFile, data, (err)=>{
                if(err)
                    console.log(`ERROR: Failed to write data to ${config.roomsFile} - description:\n ${err}`);
                /* Execute callback */
                callback.call(this, err);
            });
            
        }
    },
    getRoom: function(roomId, callback) {
        /*
         * Get user data
         */
         
        /* Check given data */
        if(typeof roomId === 'string'){
            const $fileManip = this;
            $fileManip.readRooms(false, (err, data)=>{
                if(!err){
                    data.list = data.list.filter(el=>{
                        return el.id == roomId;
                    });
                    if(data.list.length == 0)
                        callback.call(this, false);
                    else
                        callback.call(this, data.list[0]);                
                    
                } else {
                    console.log(`Failed to get room information, description:\n ${err}`);
                }  
            });
        } else {
            callback.call(this, false);
        }
    }
};

module.exports = fileManip;