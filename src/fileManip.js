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
        
        fs.readFile(config.usersFile, "utf-8", (err, data)=>{
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
        if(data && typeof data === "object" && data.users){
            /* Prepare data */
            data = JSON.stringify(data);
            /* Write data */
            fs.writeFile(config.usersFile, data, (err)=>{
                if(err)
                    console.log(`ERROR: Failed to write data to ${config.usersFile} - description:\n ${err}`);
                /* Execute callback */
                callback.call(this, err);
            })
        }
    }
}

module.exports = fileManip;