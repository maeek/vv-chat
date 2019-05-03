# VV-CHAT
Simple websocket chat written in javascript

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

### Compatible with all modern browsers
Including Microsoft Edge >= 13

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


#### config.js
Change this settings for your own needs

| Name | Default values |
| ------ | ------ |
| port | 3000 |
| Session Secret | chattyPatty |
| Users File | src/users.json |
| Rooms File | src/rooms.json |
| Default room values | ```{id: "landing", name: "Main", icon: "0x1f47e"} //👾``` |
| Certificates | ```./server.[crt, csr, key]``` |

#### users.json
File structure
```
{
    "users": [{
            "username": "",
            "password": "",
            "first": true/false, // If true user will be asked for new password
            "clientId": "" // Random string, default length is 22 characters
        }]
}
```

#### rooms.json
File structure
```
{
    "list": [{
            "id": "landing", // Random string, default length 10 characters
            "name": "Main",
            "icon": "0x1f47e", //👾
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
ProxyPass "/" "h2://localhost:3000/"
ProxyPassReverse "/" "https://localhost:3000/"
```