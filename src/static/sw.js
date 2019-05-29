/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-console */

/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */

console.log('WORKER: started');

var version = 'v1.1.18::';
var CACHE = 'network-or-cache';
var OFFLINE_PAGE = '/static/offline.html';
var offlineFundamentals = [
    '/login/',
    '/css/main.min.css',
    '/static/offline.html',
    '/js/emoji.json',
    '/js/clientFunc.js',
    '/js/client.js',
    '/js/socket.io.js',
    '/js/js.cookie.main.js',
    '/static/pull-out.ogg',
    '/static/bg.png',
    '/static/err.jpg',
    '/favicon.ico',
    '/css/fonts/KoHo.woff2',
    '/css/fonts/KoHo-ext.woff2',
    '/css/fonts/Major.woff2',
    '/css/fonts/Major-ext.woff2',
    '/css/fonts/material-icons.woff2',
    '/static/offline.html'
];

self.addEventListener('install', function(event) {
    console.log('WORKER: install in progress');
    event.waitUntil(caches
        .open(version + 'pages')
        .then(function(cache) {
            return cache.addAll(offlineFundamentals);
        })
        .then(function() {
            console.log('WORKER: install completed');
        }).catch(function(e) {
            console.log('WORKER: install failed - ' + e);
        })
    );
});



self.addEventListener('fetch', function(event) {
    console.log('WORKER: fetch event in progress.');
    if ((event.request.method !== 'GET') || (event.request.url.indexOf('/logout') !== -1) || (event.request.url.indexOf('/login/') !== -1) || (event.request.url.indexOf('/socket.io/') !== -1)) {
        console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
        return false;
    }

    event.respondWith(
        caches
            .match(event.request)
            .then(function(cached) {

                var networked = fetch(event.request)
                    .then(fetchedFromNetwork, unableToResolve)
                    .catch(unableToResolve);

                console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
                return cached || networked;

                function fetchedFromNetwork(response) {
                    var cacheCopy = response.clone();

                    console.log('WORKER: fetch response from network.', event.request.url);

                    caches
                        .open(version + 'pages')
                        .then(function add(cache) {
                            return cache.put(event.request, cacheCopy);
                        })
                        .then(function() {
                            console.log('WORKER: fetch response stored in cache.', event.request.url);
                        });

                    return response;
                }

                function unableToResolve(cache) {
                    console.log('WORKER: fetch request failed in both cache and network.');
                    return cache.match(OFFLINE_PAGE);
                }
            }));
});

self.addEventListener('activate', function(event) {
    console.log('WORKER: activate event in progress.');

    event.waitUntil(
        caches
            .keys()
            .then(function(keys) {
                return Promise.all(
                    keys
                        .filter(function(key) {
                            return !key.startsWith(version);
                        })
                        .map(function(key) {
                            return caches.delete(key);
                        })
                );
            })
            .then(function() {
                console.log('WORKER: activate completed.');
            })
    );
});

function send_message_to_client(client, msg) {
    return new Promise(function(resolve, reject) {
        var msg_chan = new MessageChannel();

        msg_chan.port1.onmessage = function(event) {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };

        client.postMessage(msg, [msg_chan.port2]);
    });
}

self.addEventListener('message', function(event) {
    if (event.data == 'getEmojis') {
        self.clients.get(event.source.id).then(client => {
            fetch('/js/emoji.json', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(emojis => {
                send_message_to_client(client, { what: 'getEmojis', emojis: emojis });
                //event.ports[0].postMessage({what: 'getEmojis', emojis: emojis});
            }).catch(() => {
                send_message_to_client(client, { what: 'failedEmojis' });
                //event.ports[0].postMessage({what: 'failedEmojis'});            
            });
        });

    }
});