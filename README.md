# VV-CHAT
Websocket chat written in javascript

### Features

  - HTTP/2
  - No chat history on the server
  - Send photos
  - HTTPS
  - Remove messages that you sent
  - Easy user managemet through web panel
  - Links highlight
  - Emojis
  - Chat Rooms
  - PWA
  - Mobile friendly

### Page screenshots
![Login page](https://raw.githubusercontent.com/maeek/vv-chat/master/src/static/static/vv-login.png)
![First login page](https://raw.githubusercontent.com/maeek/vv-chat/master/src/static/static/vv-setup.png)
![Chat page](https://raw.githubusercontent.com/maeek/vv-chat/master/src/static/static/vv-chat.png)
![Management page](https://raw.githubusercontent.com/maeek/vv-chat/master/src/static/static/vv-manage.png)


### Compatible with all modern browsers
Including Microsoft Edge >= 13

#### Known bugs
 - Sending files doesn't work on IOS

### Requiremets

  - [Node.js](https://nodejs.org/) >= 10.15.3
  - [NPM](https://www.npmjs.com/get-npm)

### Installation

```sh
$ git clone https://github.com/maeek/vv-chat.git
$ cd vv-chat
$ npm install
```
Normal start
```sh
$ npm run start
```

For docker
```sh
$ npm run docker
```
Mount your volume to ```/app/input/``` and place there certificates, users.json and rooms.json. (users.json and rooms.json will be created on first start)

The password for root account will be generated on first start


#### src/config.js
Change this settings for your own needs

| Name | Default values |
| ------ | ------ |
| port | 3000 |
| Session Secret | chattyPatty |
| Users File | src/users.json |
| Rooms File | src/rooms.json |
| Default room values | ```{id: "landing", name: "Main", icon: "😍"}``` |
| Certificates | ```./server.[crt, csr, key]``` |

#### src/users.json
File structure
```
{
    "users": [{
            "username": "",
            "password": "", // hash
            "first": true/false, // If true user will be asked for new password on login
            "clientId": "" // Random string, default length is 22 characters
        }]
}
```

#### src/rooms.json
File structure
```
{
    "list": [{
            "id": "landing", // Random string, default length 10 characters
            "name": "Main",
            "icon": "😍",
            "password": { // Not yet implemented
                "required": false,
                "hash": ""
            }
        }]
}
```

#### passwordHash.js
Generate hash from command line
Usage
```sh
$ node passwordHash.js password
```

### Integrate VV-CHAT with Apache

Add this to your vhost configuration file
```
Protocols h2
ProxyPass "/" "h2://localhost:3000/"
ProxyPassReverse "/" "https://localhost:3000/"
```
