/* eslint-disable consistent-return */
/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-rest-params */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 *
 */

(function appendPolyfill(arr) {
    arr.forEach((item) => {
        if (item.hasOwnProperty('append')) {
            return;
        }
        Object.defineProperty(item, 'append', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function append() {
                const argArr = Array.prototype.slice.call(arguments);
                const docFrag = document.createDocumentFragment();

                argArr.forEach((argItem) => {
                    const isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.appendChild(docFrag);
            },
        });
    });
}([Element.prototype, Document.prototype, DocumentFragment.prototype]));
(function prependPolyfill(arr) {
    arr.forEach((item) => {
        if (item.hasOwnProperty('prepend')) {
            return;
        }
        Object.defineProperty(item, 'prepend', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function prepend() {
                const argArr = Array.prototype.slice.call(arguments);
                const docFrag = document.createDocumentFragment();

                argArr.forEach((argItem) => {
                    const isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.insertBefore(docFrag, this.firstChild);
            },
        });
    });
}([Element.prototype, Document.prototype, DocumentFragment.prototype]));
navigator.browserSpecs = (function browserSpecsFunc() {
    const ua = navigator.userAgent;
    let tem;
    let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return {
            name: 'IE',
            version: (tem[1] || ''),
        };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) {
            return {
                name: tem[1].replace('OPR', 'Opera'),
                version: tem[2],
            };
        }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    tem = ua.match(/version\/(\d+)/i);
    if (tem != null) { M.splice(1, 1, tem[1]); }
    return {
        name: M[0],
        version: M[1],
    };
}());

function domFromText(html) {
    return new DOMParser().parseFromString(html, 'text/html').body.childNodes;
}

function appendDOM(HTML, element) {
    const childNodes = domFromText(HTML);
    for (let i = 0; i < childNodes.length; i++) {
        document.querySelector(element).append(childNodes[i]);
    }
}

function prependDOM(HTML, element) {
    const childNodes = domFromText(HTML);
    for (let i = 0; i < childNodes.length; i++) {
        document.querySelector(element).prepend(childNodes[i]);
    }
}

function hasClass(elem, cls) {
    if (!('className' in elem)) return;
    return !!elem.className.match(new RegExp(`\\b${cls}\\b`));
}
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === 'http:' && !localStorage.getItem('useHTTP')) {
        prependDOM(`<div class="http noselect">
                    <div class="http--icon"><i class="material-icons">warning</i></div>
                    <div class="http--description">Warning: HTTPS is not enabled which means that this page is not secure, use it at own risk. If you're administrator please provide SSL certificates, <a href="https://letsencrypt.org/getting-started/">check how to get them</a>.</div>
                    <i class="material-icons http--close">close</i>
                </div>`, 'body');
        const wh = document.height !== undefined ? document.body.height : document.body.offsetHeight;
        document.querySelector('.page__wrapper').style['max-height'] = `${wh - document.querySelector('.http').clientHeight}px`;
    }
    document.addEventListener('click', (e) => {
        if (e.target && hasClass(e.target, 'http--close')) {
            document.querySelector('.http').remove();
            document.querySelector('.page__wrapper').removeAttribute('style');
            localStorage.setItem('useHTTP', true);
        }
    });

    document.querySelector('form').addEventListener('submit', (e) => {
        if (document.querySelector('input[name="username"]').value.trim().length > 1 && document.querySelector('input[name="password"]').value.trim().length > 4) {
            document.querySelector('.finger').innerHTML = 'autorenew';
            document.querySelector('.finger').classList.add('spin');
            return true;
        }
        if (document.querySelector('input[name="username"]').value.trim().length < 1) { document.querySelector('input[name="username"]').style['box-shadow'] = '0px 3px 1px #ff4747'; }
        if (document.querySelector('input[name="password"]').value.trim().length < 5) { document.querySelector('input[name="password"]').style['box-shadow'] = '0px 3px 1px #ff4747'; }
        e.preventDefault();
        return false;
    });
    const hash = window.location.hash.substring(1);
    switch (hash) {
    case 'wrong':
        document.querySelector('.status__div').classList.add('statusError');
        document.querySelector('.status__div').innerHTML = 'You enterd wrong username or password';
        break;
    case 'error':
        document.querySelector('.status__div').classList.add('statusError');
        document.querySelector('.status__div').innerHTML = 'Couldn\'t log in to this account';
        break;
    case 'disabled':
        document.querySelector('.status__div').classList.add('statusError');
        document.querySelector('.status__div').innerHTML = 'This account is disabled';
        break;
    default:
        break;
    }

    function notSupported() {
        document.querySelector('.container').innerHTML = '';
        appendDOM('<div class="whatIsThis"><div class="cmon">You can do better than this!</div><div class="notsupported">This version of your browser is not supported. Update it or install any modern browser.</div><ul><li><a href="https://www.google.com/intl/en/chrome/">Chrome</a></li><li><a href="https://www.mozilla.org/en-US/firefox/">Firefox</a></li><li><a href="https://www.opera.com/">Opera</a></li></ul></div>', '.container', false);
    }
    const browser = navigator.browserSpecs;
    switch (browser.name) {
    case 'Chrome':
        if (navigator.browserSpecs.version < 50) { notSupported(); }
        break;
    case 'Firefox':
        if (navigator.browserSpecs.version < 60) { notSupported(); }
        break;
    case 'Edge':
        if (navigator.browserSpecs.version < 13) { notSupported(); }
        break;
    case 'IE':
        notSupported();
        break;
    default:
        break;
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((r) => {
            console.log('SW scope:', r.scope);
            console.log('ServiceWorker zarejestrowany.');
        }).catch((e) => {
            console.log(`Ups! Błąd przy rejestracji ServiceWorkera! ${e}`);
        });
    }
});