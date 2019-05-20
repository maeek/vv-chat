/* eslint-disable no-undef */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */

/* Parse string to html */
const domFromText = html => new DOMParser().parseFromString(html, 'text/html').body.childNodes;

/* Notification */
let sound = new Audio();
sound.src = '/static/pull-out.ogg';

/* Select first element */
const $ = element => document.querySelector(element);
/* Select all elements */
const $$ = element => document.querySelectorAll(element);
/* Check if element has class */
const hasClass = (elem, cls) => {
    if (!('className' in elem)) return;
    return !!elem.className.match(new RegExp('\\b' + cls + '\\b'));
};
/* Get image dimensions */
const getImageDimensions = file => new Promise(function(resolved) {
    var i = new Image();
    i.onload = function() {
        resolved({ w: i.width, h: i.height });
    };
    i.src = file;
});

/* Get actual time */
const getTime = () => new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');

/* format file size */
function formatSizeUnits(bytes) {
    if (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + ' GB'; } else if (bytes >= 1048576) { bytes = (bytes / 1048576).toFixed(2) + ' MB'; } else if (bytes >= 1024) { bytes = (bytes / 1024).toFixed(2) + ' KB'; } else if (bytes > 1) { bytes = bytes + ' bytes'; } else if (bytes == 1) { bytes = bytes + ' byte'; } else { bytes = '0 bytes'; }
    return bytes;
}

/* Prepend html */
function prependDOM(HTML, element, scroll) {
    /* Scroll to bottom */
    scroll = scroll ? true : false;
    /* Convert string to dom */
    const childNodes = domFromText(HTML);
    const middleDiv = $('.panel--middle');
    if ($$('.typing').length > 0) $('.typing').remove();

    /* Prepend nodes to element */
    for (let i = 0; i < childNodes.length; i++) {
        $(element).prepend(childNodes[i]);
    }

    /* Scroll to bottom */
    if ((middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
        middleDiv.scrollHeight,
        middleDiv.offsetHeight,
        middleDiv.clientHeight
    ) - 250) && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }

}

/* Append html string to element */
function appendDOM(HTML, element, scroll) {
    /* Scroll to bottom */
    scroll = scroll ? true : false;
    /* Convert string to dom */
    const childNodes = domFromText(HTML);
    const middleDiv = $('.panel--middle');
    if ($$('.typing').length > 0) $('.typing').remove();

    /* Append nodes to element */
    for (let i = 0; i < childNodes.length; i++) {
        $(element).append(childNodes[i]);
    }
    
    /* Scroll to bottom */
    if ((middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
        middleDiv.scrollHeight,
        middleDiv.offsetHeight,
        middleDiv.clientHeight
    ) - 200) && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || 'object' != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error('Unable to copy obj! Its type isn\'t supported.');
}

/* Error message timeout */
let errTim;

/* Display error message */
function error(message, timeout) {
    /* Timeout duration */
    timeout = !timeout ? 2000 : timeout;
    /* Generate unique error ID */
    const errID = 'errID-' + randomString();
    /* Error message template */
    const HTML = `<div data-eid="${errID}" class="tost tost--error noselect">Error: ${message}</div>`;
    /* Remove tost messages */
    if ($$('.tost').length > 0) $('.tost').remove();
    /* Append error to body */
    appendDOM(HTML, 'body');
    /* Error enter transition */
    $('.tost').classList.add('tost-enter');
    /* Clear error timeout */
    clearTimeout(errTim);
    /* Remove error after timeout */
    errTim = setTimeout(function() {
        $(`.tost[data-eid="${errID}"]`).classList.remove('tost-enter');
        $(`.tost[data-eid="${errID}"]`).classList.add('tost-leave');
        setTimeout(function() {
            $(`.tost[data-eid="${errID}"]`).remove();
        }, 300);

    }, timeout);
}

/* Sanitaze string */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* Generate random string */
function randomString(length) {
    length = !length ? 15 : length;
    const chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    let string = '';
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}

/* Unread messages count and notification timeout */
let unread = 0,
    notf;

/* Notification */
function newNotf(user, image) {
    image = image ? true : false;
    /* Default title */
    const title = 'VV-Chat';
    /* Change title - ${Who} sent ${what} */
    document.title = `${escapeHtml(user.toUpperCase())} sent${(image)?' photo':' message'}`;
    clearTimeout(notf);
    /* Inrcrement unread messages if window is not focused */
    if (!document.hasFocus())
        unread++;
    /* Return to default title */
    notf = setTimeout(() => {
        document.title = title;
        if (!document.hasFocus()) {
            document.title = `( ${unread} ) VV-Chat`;
        }
    }, 2000);
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    /* Vibrate */
    if (navigator.vibrate) {
        if (!window.localStorage.getItem('disableVibration')){
            try{
                navigator.vibrate(150);
            }
            catch(e){
                // eslint-disable-next-line no-console
                console.log('Vibration requires user interaction first');
            }
        }
    }
    /* Sound alert */
    if (!window.localStorage.getItem('mute')) {
        try{
            sound.src = '/static/pull-out.ogg';
            sound.play();
        }
        catch(e) {
            // eslint-disable-next-line no-console
            console.log('Sound notifiaction requires user interaction first');   
        }
    }
}

/* Change title to default */
function windowWasFocused() {
    unread = 0;
    document.title = 'VV-Chat';
}


/* ::TODO
    Switching servers
     <div class="subtitle noselect">Change server</div>
    <div class="input__div">
        <form>
            <div class="input__div--wrapper">
                <input type="text" name="server" placeholder="Type new server link ie. https://www.example.pl/" autocomplete="off">
                <i class="material-icons noselect change--server">device_hub</i>
            </div>
        </form>
    </div>

*/

/* Show settings function */
function openSettings() {
    const HTML = `<div class="modal__div">
                    <div class="settings__cont">
                        <div class="settings__exit noselect"><i class="material-icons">close</i></div>
                        <div class="title noselect">Settings</div>
                        <p class="description noselect">Change settings for your account - ${Cookies.get('user')}</p>
                        <div class="subtitle noselect">Theme</div>
                        <div class="input__div">
                            <div class="input__div--wrapper input__div--wrapper--nobg">
                                <span>Pure black</span>
                                <label><input type="checkbox" name="themeBlack" class="themeBlack"><div class="checkboxWrapper themeBlack"></div></label>
                            </div>
                        </div>
                        <div class="subtitle noselect">Notifications</div>
                        <div class="input__div">
                            <div class="input__div--wrapper input__div--wrapper--nobg">
                                <span>Mute notifications sound</span>
                                <label><input type="checkbox" name="muteNotifications" class="mute"><div class="checkboxWrapper"></div></label>
                            </div>
                            <div class="input__div--wrapper input__div--wrapper--nobg">
                                <span>Disable vibration</span>
                                <label><input type="checkbox" name="disableVibration" class="disableVibration"><div class="checkboxWrapper vibrate"></div></label>
                            </div>
                        </div>
                        <div class="subtitle noselect">Change password</div>
                        <div class="input__div">
                            <form>
                            <div class="input__div--wrapper">
                                    <input type="password" name="resetPasswordOld" placeholder="Type old password" autocomplete="current-password">
                                </div>    
                            <div class="input__div--wrapper">
                                <input type="password" name="resetPassword" placeholder="Type new password, at least 5 characters" autocomplete="new-password">
                                <i class="material-icons noselect change--password">done</i>
                            </div>
                            <div class="status__div"></div>
                            </form>
                        </div>
                        <div class="subtitle noselect">Your active sessions</div>
                        <div class="input__div">
                            <ul class="activeSessions"></ul>
                        </div>
                        <div class="footer">
                            <div class="branding noselect">1.1.1</div>
                            <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                        </div>
                    </div>
                </div>`;
    appendDOM(HTML, 'body', false);
    if (window.localStorage.getItem('mute'))
        $('.mute').checked = true;
    if (window.localStorage.getItem('disableVibration'))
        $('.disableVibration').checked = true;
    if (hasClass($('body'), 'pure-dark'))
        $('[name="themeBlack"]').checked = true;
    $('.modal__div').classList.add('anim--opacity');
    $('.settings__cont').classList.add('anim--opacity', 'anim--scale');
}

function operations(e) {
    if (e.target && hasClass(e.target, 'settings__exit') || hasClass(e.target.parentNode, 'settings__exit')) {

        $('.settings__cont').classList.remove('anim--opacity', 'anim--scale');
        $('.modal__div').classList.remove('anim--opacity');
        setTimeout(function() {
            $('.modal__div').remove();
        }, 300);
    } else if (e.target && hasClass(e.target, 'change--password')) {
        const oldPassDiv = e.target.parentNode.parentNode.querySelector('input[name=\'resetPasswordOld\']');
        const newPassDiv = e.target.parentNode.querySelector('input[name=\'resetPassword\']');
        if (newPassDiv.value.length > 4) {
            fetch('/setup', {
                body: JSON.stringify({
                    oldPassword: oldPassDiv.value.trim(),
                    password: newPassDiv.value.trim()
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                credentials: 'same-origin'
            }).then(res => res.json()).then(data => {
                if (data.status) {
                    $('.status__div').classList.remove('statusError');
                    $('.status__div').classList.add('statusSuccess');
                    $('.status__div').innerHTML = 'Password updated';
                    newPassDiv.value = '';
                    oldPassDiv.value = '';
                } else {
                    $('.status__div').classList.remove('statusSuccess');
                    $('.status__div').classList.add('statusError');
                    $('.status__div').innerHTML = 'Failed to update password';
                }
            });
        } else {
            $('.status__div').classList.remove('statusSuccess');
            $('.status__div').classList.add('statusError');
            $('.status__div').innerHTML = 'Password to short';
        }
    } else if (e.target && hasClass(e.target, 'wrap--aside') || hasClass(e.target.parentNode, 'wrap--aside')) {
        if ($('aside').getAttribute('data-hidden') == 'yes') {
            $('aside').style.flex = '0 0 250px';
            $('aside').setAttribute('data-hidden', 'no');
        } else {
            $('aside').style.flex = '0 0 0';
            $('aside').setAttribute('data-hidden', 'yes');
        }
    }
}



function settingsInput(e) {
    if (e.target && hasClass(e.target, 'mute')) {
        const mute = e.target.checked;
        if (mute)
            window.localStorage.setItem('mute', true);
        else
            window.localStorage.removeItem('mute');
    } else if (e.target && hasClass(e.target, 'disableVibration')) {
        const vibe = e.target.checked;
        if (vibe) {
            window.localStorage.setItem('disableVibration', true);
        } else {
            navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            window.localStorage.removeItem('disableVibration');
        }
    } else if (e.target && hasClass(e.target, 'themeBlack')) {
        if (hasClass($('body'), 'pure-dark')) {
            $('body').classList.remove('pure-dark');
        } else {
            $('body').classList.add('pure-dark');
        }
    }
}

// const emojis = new FontFace('KoHo', 'url(/css/fonts/emoji.ttf)', {
//     style: 'normal',
//     unicodeRange: 'U+2700-27BF, U+1F300-1F5FF, U+1F900-1F9FF, U+1F600-1F64F, U+1F680-1F6FF, U+2600-26FF, U+1f1e6-1f251',
//     weight: '400'
// });

function returnEmoji(emoji) {
    let uni = emoji.indexOf('-') != -1 ? emoji.split('-') : [emoji];
    let uniCode = '';
    for (let j = 0; j < uni.length; j++) {
        uniCode += String.fromCodePoint(parseInt(uni[j], 16));
    }
    return uniCode;
}

function appendImage(socket, files, fromClipboard) {
    fromClipboard = fromClipboard?true:false;
    if (Cookies.get('user')) {
        if (socket.io.readyState == 'open') {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileType = file.type;
                if (file.type.indexOf('image') >= 0) {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function(e) {
                        const arrayBuffer = e.target.result.replace(/^data:.+;base64,/, '');
                        const mid = `ms-${randomString()}-${Cookies.get('clientId')}`;
                        const time = getTime();
                        const HTML = `<li class="ms from__me" data-mid="${mid}">
                            <div class="time noselect">${time}</div>
                            <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                            <div class="message message--image">
                                <img data-type="${file.type}" data-name="${file.name}" src="data:${file.type};base64,${arrayBuffer}">
                                <div class="loader"></div>
                            </div>
                            <div class="who noselect nodisplay" data-user="${escapeHtml(Cookies.get('user'))}">${escapeHtml(Cookies.get('user').substring(0, 1).toUpperCase())}</div>
                        </li>`;
                        if ($$('.typing').length > 0) $('.typing').remove();
                        
                        const panelMiddle = $('.panel--middle');
                        getImageDimensions(`data:${file.type};base64,${arrayBuffer}`).then(dims => {
                            appendDOM(HTML, '.panel--middle', false);
                            $(`.ms[data-mid="${mid}"]`).classList.add('transition-X');

                            socket.emit('image', {
                                username: Cookies.get('user'),
                                type: fileType,
                                name: file.name,
                                blob: arrayBuffer,
                                mid: mid
                            }, (uploaded) => {
                                if (uploaded) {
                                    $(`.from__me[data-mid="${mid}"] .loader`).remove();
                                }
                            });
                            // panelMiddle.scrollTop = panelMiddle.scrollTop + dims.h;
                            if (panelMiddle.scrollTop + panelMiddle.clientHeight + (dims.h>400?400:dims.h) > Math.max(
                                panelMiddle.scrollHeight,
                                panelMiddle.offsetHeight,
                                panelMiddle.clientHeight
                            ) - 250) { panelMiddle.scrollTop = panelMiddle.scrollHeight + dims.h; } 
                        });
                        fileReader.abort();
                        $('.textField').focus();
                    };
                    fileReader.readAsDataURL(fromClipboard?file.getAsFile():file);
                }
            }
        } else {
            error('Failed sending message');
            $('.textField').focus();
        }
    } else {
        socket.close();
        location.href = '/logout';
    }
}

function appendMessage(socket) {
    /* Get value */
    let val = $('.textField').value.trim();
    /* Get time */
    const time = getTime();
    /* Check if values length != 0 */
    if (val != '' && Cookies.get('user')) {
        /* Check if socket is open */
        if (socket.io.readyState == 'open') {
            /* Generate unique message id */
            const mid = `ms-${randomString()}-${Cookies.get('clientId')}`;
            /* Send message */
            socket.emit('message', {
                username: Cookies.get('user'),
                message: val,
                time: time,
                mid: mid
            });
            /* Sanitaze */
            val = escapeHtml(val);
            /* Get links from value */
            const reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gim;
            /* Swap links with anchors */
            let preparedText = val.replace(reg, '<a href="$1" target="_blank">$1</a>');
            /* Message template */
            const HTML = `<li class="ms from__me" data-mid="${mid}">
                            <div class="time noselect">${time}</div>
                            <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                            <div class="message">${preparedText}</div>
                        </li>;`;
            /* Append message */
            appendDOM(HTML, '.panel--middle', true);
            twemoji.parse($('.panel--middle'));            
            const middleDiv = $('.panel--middle');
            /* Scroll to bottom */
            middleDiv.scrollTop = middleDiv.scrollHeight;
            /* Show message */
            $(`.ms[data-mid="${mid}"]`).classList.add('transition-X');
            /* Clear text field */
            $('.textField').value = '';
            /* Focus text field */
            $('.textField').focus();
        } else {
            /* Display error if socket is closed */
            error('Failed sending message');
            $('.textField').focus();
        }
    } else if (typeof Cookies.get('user') === 'undefined' || typeof Cookies.get('clientId') === 'undefined') {
        /* Disconnect and log out if cookies are not set properly */
        socket.close();
        location.href = '/logout';
    }
}

/* Initiate timeout for tost message if user scrolled up by 250px */
let isUpTimeout;

/* Tost */
function tost(mid, username, message) {
    const middleDiv = $('.panel--middle');
    const isFile = !message?true:false;
    message = !message?'Sent photo':escapeHtml(message.length > 25 ? message.substring(0, 25) + '...' : message);
    const isUp = `<div data-mid="${mid}" class="tost noselect">
                <div class="who">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
                <div class="text">${message}</div>
            </div>`;
    if (middleDiv.scrollTop + middleDiv.clientHeight < Math.max(
        middleDiv.scrollHeight,
        middleDiv.offsetHeight,
        middleDiv.clientHeight
    ) - 250) {
        clearTimeout(isUpTimeout);
        if ($$('.tost').length > 0) {
            $('.tost').setAttribute('data-mid', mid);
            $('.tost .who').innerHTML = escapeHtml(username.substring(0, 1).toUpperCase());
            $('.tost .text').innerHTML = message;
            $(`.tost[data-mid="${mid}"]`).classList.remove('tost-leave');
        } else {
            appendDOM(isUp, 'body', false);
            twemoji.parse($(`.tost[data-mid="${mid}"]`));            
            $(`.tost[data-mid="${mid}"]`).classList.add('tost-enter');
        }
        isUpTimeout = setTimeout(function() {
            if($(`.tost[data-mid="${mid}"]`))        
                $(`.tost[data-mid="${mid}"]`).classList.add('tost-leave');
            setTimeout(function() {
                if($(`.tost[data-mid="${mid}"]`))
                    $(`.tost[data-mid="${mid}"]`).remove();
            }, 300);
        }, 4000);
    } else if(!isFile){
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }
}

function prepareTwemoji () {
    var twemojiScript = document.createElement('script');
    twemojiScript.src = '/js/twemoji.min.js';
    twemojiScript.onload = function () {
        twemoji.parse(document.body);
        $('.panel--middle').classList.add('twemojified');
        $('.sendEmoji').classList.add('twemojified');
    };
    document.head.append(twemojiScript);
}



export {
    $,
    $$,
    hasClass,
    getImageDimensions,
    getTime,
    domFromText,
    formatSizeUnits,
    appendDOM,
    errTim,
    error,
    escapeHtml,
    randomString,
    unread,
    newNotf,
    openSettings,
    settingsInput,
    operations,
    windowWasFocused,
    prependDOM,
    returnEmoji,
    appendImage,
    appendMessage,
    isUpTimeout,
    tost,
    prepareTwemoji,
    clone
};