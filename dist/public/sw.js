/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.5
 * 
 */

console.log("WORKER: started");

var version = 'v1.0.8::';
var CACHE = 'network-or-cache';
var offlineFundamentals = [
    '/js/func.js',
    '/js/client.js',
    '/js/socket.io.js',
    '/js/js.cookie.main.js',
    '/static/pull-out.ogg',
    '/static/bg.png',
    '/static/err.jpg'
];

self.addEventListener("install", function(event) {
    console.log("WORKER: install in progress");
    event.waitUntil(caches
        .open(version + 'fundamentals')
        .then(function(cache) {
            return cache.addAll(offlineFundamentals);
        })
        .then(function() {
            console.log('WORKER: install completed');
        }).catch(function(e) {
            console.log("WORKER: install failed - " + e)
        })
    );
});



self.addEventListener("fetch", function(event) {
    console.log('WORKER: fetch event in progress.');
    if ((event.request.method !== 'GET') || (event.request.url.indexOf("/logout") !== -1) || (event.request.url.indexOf("/login") !== -1) || (event.request.url.indexOf("/socket.io") !== -1)) {
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

            function unableToResolve() {
                console.log('WORKER: fetch request failed in both cache and network.');
                return new Response(`<h1>Service Unavailable</h1>`, {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/html'
                    })
                });
            }
        })
    );
});

self.addEventListener("activate", function(event) {
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