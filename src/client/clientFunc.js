/* eslint-disable no-undef */
/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */


const domFromText = html => new DOMParser().parseFromString(html, 'text/html').body.childNodes;

let sound = new Audio();
sound.src = '/static/pull-out.ogg';


const $ = element => document.querySelector(element);
const $$ = element => document.querySelectorAll(element);
const hasClass = (elem, cls) => {
    if (!('className' in elem)) return;
    return !!elem.className.match(new RegExp('\\b' + cls + '\\b'));
};
const getImageDimensions = file => new Promise(function(resolved) {
    var i = new Image();
    i.onload = function() {
        resolved({ w: i.width, h: i.height });
    };
    i.src = file;
});
const getTime = () => new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');

function formatSizeUnits(bytes) {
    if (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + ' GB'; } else if (bytes >= 1048576) { bytes = (bytes / 1048576).toFixed(2) + ' MB'; } else if (bytes >= 1024) { bytes = (bytes / 1024).toFixed(2) + ' KB'; } else if (bytes > 1) { bytes = bytes + ' bytes'; } else if (bytes == 1) { bytes = bytes + ' byte'; } else { bytes = '0 bytes'; }
    return bytes;
}

function prependDOM(HTML, element, scroll) {
    scroll = scroll ? true : false;
    const childNodes = domFromText(HTML);
    const middleDiv = $('.panel--middle');
    if ($$('.typing').length > 0) $('.typing').remove();

    for (let i = 0; i < childNodes.length; i++) {
        $(element).prepend(childNodes[i]);
    }

    if ((middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
        middleDiv.scrollHeight,
        middleDiv.offsetHeight,
        middleDiv.clientHeight
    ) - 250) && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }

}

function appendDOM(HTML, element, scroll) {
    scroll = scroll ? true : false;
    const childNodes = domFromText(HTML);
    const middleDiv = $('.panel--middle');
    if ($$('.typing').length > 0) $('.typing').remove();

    for (let i = 0; i < childNodes.length; i++) {
        $(element).append(childNodes[i]);
    }

    if ((middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
        middleDiv.scrollHeight,
        middleDiv.offsetHeight,
        middleDiv.clientHeight
    ) - 250) && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }

}

let errTim;

function error(message, timeout) {
    timeout = !timeout ? 2000 : timeout;
    const errID = 'errID-' + randomString();
    const HTML = `<div data-eid="${errID}" class="tost tost--error noselect">Error: ${message}</div>`;
    if ($$('.tost').length > 0) $('.tost').remove();
    appendDOM(HTML, 'body');
    $('.tost').classList.add('tost-enter');
    clearTimeout(errTim);
    errTim = setTimeout(function() {
        $(`.tost[data-eid="${errID}"]`).classList.remove('tost-enter');
        $(`.tost[data-eid="${errID}"]`).classList.add('tost-leave');
        setTimeout(function() {
            $(`.tost[data-eid="${errID}"]`).remove();
        }, 300);

    }, timeout);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function randomString(length) {
    length = !length ? 15 : length;
    const chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    let string = '';
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}

let unread = 0,
    notf;

function newNotf(user, image) {
    image = image ? true : false;
    const title = 'VV-Chat';
    document.title = `${escapeHtml(user.toUpperCase())} sent${(image)?' photo':' message'}`;
    clearTimeout(notf);
    if (!document.hasFocus())
        unread++;
    notf = setTimeout(() => {
        document.title = title;
        if (!document.hasFocus()) {
            document.title = `( ${unread} ) VV-Chat`;
        }
    }, 2000);
    try {
        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
        if (navigator.vibrate) {
            if (!window.localStorage.getItem('disableVibration'))
                navigator.vibrate(150);
        }
        if (!window.localStorage.getItem('mute')) {
            sound.src = '/static/pull-out.ogg';
            sound.play();
        }
    } catch (e) {
        return false;
    }
}

function windowWasFocused() {
    unread = 0;
    document.title = 'VV-Chat';
}



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
                            <div class="input__div--wrapper">
                                    <input type="password" name="resetPasswordOld" placeholder="Type old password" autocomplete="current-password">
                                </div>    
                            <div class="input__div--wrapper">
                                <input type="password" name="resetPassword" placeholder="Type new password, at least 5 characters" autocomplete="new-password">
                                <i class="material-icons noselect change--password">done</i>
                            </div>
                            <div class="status__div"></div>
                        </div>
                        <div class="subtitle noselect">Your active sessions</div>
                        <div class="input__div">
                            <ul class="activeSessions"></ul>
                        </div>
                        <div class="footer">
                            <div class="branding noselect">1.1.0</div>
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
                method: 'POST'
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

const emojis = new FontFace('KoHo', 'url(/css/fonts/emoji.ttf)', {
    style: 'normal',
    unicodeRange: 'U+2700-27BF, U+1F300-1F5FF, U+1F900-1F9FF, U+1F600-1F64F, U+1F680-1F6FF, U+2600-26FF, U+1f1e6-1f251',
    weight: '400'
});

function returnEmoji(emoji) {
    let uni = emoji.indexOf('-') != -1 ? emoji.split('-') : [emoji];
    let uniCode = '';
    for (let j = 0; j < uni.length; j++) {
        uniCode += String.fromCodePoint(parseInt(uni[j], 16));
    }
    return uniCode;
}

function appendImage(socket, files) {
    if (Cookies.get('user')) {
        if (socket.io.readyState == 'open') {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

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
                                type: file.type,
                                name: file.name,
                                blob: arrayBuffer,
                                mid: mid
                            }, (uploaded) => {
                                if (uploaded) {
                                    $(`.from__me[data-mid="${mid}"] .loader`).remove();
                                }
                            });
                            panelMiddle.scrollTop = panelMiddle.scrollTop + dims.h;
                            if (panelMiddle.scrollTop + panelMiddle.clientHeight > Math.max(
                                panelMiddle.scrollHeight,
                                panelMiddle.offsetHeight,
                                panelMiddle.clientHeight
                            ) - 250) { panelMiddle.scrollTop = panelMiddle.scrollHeight + dims.h; } else { panelMiddle.scrollTop = panelMiddle.scrollTop - dims.h; }
                        });
                        $('.textField').focus();
                    };
                    fileReader.readAsDataURL(file);
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

export {
    $,
    $$,
    hasClass,
    getImageDimensions,
    getTime,
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
    emojis,
    operations,
    windowWasFocused,
    prependDOM,
    returnEmoji,
    appendImage,
    appendMessage
};