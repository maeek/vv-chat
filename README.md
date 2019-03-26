# VV-CHAT
Simple websocket chat

### Features

  - HTTPS support
  - No chat history on the server
  - Remove the messages that you sent
  - Send photos
  - Easy user managemet through web panel
  - Links highlight


### Installation

```sh
$ git clone https://github.com/maeek/vv-chat.git
$ cd vv-chat
$ npm install
$ npm run start
```
The password for root account will be generated on first start


### Integrate VV-CHAT with Apache

Add this to your vhost configuration file
```
ProxyPass / localhost:3000
ProxyPassReverse / localhost:3000
```
If you have configured SSL on apache you don't need to provide certificates for node server


#### index.js

Please provide ssl certificates if you want to use https otherwise the server will start as http
