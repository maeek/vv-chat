/* ESLINT RULES */

/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-trailing-spaces */


/*
 * ::TODO fix DOM manipulation performance
 *  Create virtual dom and append list to this dom
 */

/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.1
 * 
 */

'use strict';
import {
    $,
    $$,
    hasClass,
    getImageDimensions,
    getTime,
    formatSizeUnits,
    appendDOM,
    prependDOM,
    error,
    escapeHtml,
    newNotf,
    openSettings,
    settingsInput,
    operations,
    windowWasFocused,
    appendFile,
    appendMessage,
    tost
} from '/js/clientFunc.js';

/* ::TODO */
/*
const config = {
    server: `${location.protocol}//${location.host}`,
    customEmojiFont: true,
    theme: {
        default: 'none',
        themes: [
            "none",
            "black",
            "old",
            "light",
        ],
    },
    messageSettings: {
        showEmojiBtn: true,
        expandImages: false,
        notificationSound: '/static/pull-out.ogg',
        removedMessagesInfo: true,
        imagesTransparency: true,
    },
    menuIsHidden: false,
};
*/

/*****************************************************************
 * 
 * Resize elements
 * 
 *****************************************************************/

window.addEventListener('DOMContentLoaded', function DOMLoaded() {

    const el = $('aside .info');
    const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
    const panel = $('.panel--middle');

    /* Alert user when using HTTP */
    if (location.protocol == 'http:' && !localStorage.getItem('useHTTP')) {
        prependDOM(`<div class="http noselect">
                <div class="http--icon"><i class="material-icons">warning</i></div>
                <div class="http--description">Warning: HTTPS is not enabled which means that this page is not secure, use it at own risk. If you're administrator please provide SSL certificates, <a href="https://letsencrypt.org/getting-started/">check how to get them</a>.</div>
                <i class="material-icons http--close">close</i>
            </div>`, 'body');
        const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
        $('main').style['max-height'] = (wh - $('.http').offsetHeight) + 'px';
    }
    /* Close http alert */
    document.addEventListener('click', function(e) {
        if (e.target && hasClass(e.target, 'http--close')) {
            $('main').removeAttribute('style');
            panel.style['max-height'] = (panel.offsetHeight + $('.http').offsetHeight) + 'px';
            document.querySelector('.http').remove();
            localStorage.setItem('useHTTP', true);
        }
    });

    if (document.width !== undefined ? document.width : document.body.offsetWidth > 900) {
        /* Resize for Desktop */
        const calc = wh - $('aside .logo__div').offsetHeight - $('aside .side--actions').offsetHeight;
        /* Resize <aside> */
        el.style['max-height'] = calc + 'px';

        const pcalc = wh - $('.panel--top').offsetHeight - $('.panel--bottom').offsetHeight - ($('.http') ? $('.http').offsetHeight : 0);
        /* Resize .panel--middle */
        panel.style['max-height'] = pcalc + 'px';
    } else {
        /* Resize for Moblie */
        const pcalc = wh - $('.panel--top').offsetHeight - $('.panel--bottom').offsetHeight - $('aside').offsetHeight - ($('.http') ? $('.http').offsetHeight : 0);
        /* Resize .panel--middle */
        panel.style['max-height'] = pcalc + 'px';
    }

    /* Window resize listener */
    window.addEventListener('resize', function win_resized() {
        const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
        if (document.width !== undefined ? document.width : document.body.offsetWidth > 900) {
            const calc = wh - $('aside .logo__div').offsetHeight - $('aside .side--actions').offsetHeight;
            /* Resize <aside> */
            el.style['max-height'] = calc + 'px';

            const pcalc = wh - $('.panel--top').offsetHeight - $('.panel--bottom').offsetHeight - ($('.http') ? $('.http').offsetHeight : 0);
            /* Resize .panel--middle */
            panel.style['max-height'] = pcalc + 'px';
        } else {
            const pcalc = wh - $('.panel--top').offsetHeight - $('.panel--bottom').offsetHeight - $('aside').offsetHeight - ($('.http') ? $('.http').offsetHeight : 0);
            /* Resize .panel--middle */
            panel.style['max-height'] = pcalc + 'px';
        }
        $('aside').removeAttribute('style');
        $('aside').removeAttribute('data-hidden');
    });

    $('.loggedUser').innerHTML = Cookies.get('user');

    /* Focus text input on page load */
    $('.textField').focus();
});


window.addEventListener('load', function() {

    /*****************************************************************
             * 
             * Initiating socket.io connection
             * 
             *****************************************************************/

    let socket = io.connect('/chat', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10
    });
    const middleDiv = $('.panel--middle');

    /*****************************************************************
             * 
             * Append polyfill
             * 
             *****************************************************************/

    (function(arr) {
        arr.forEach(function(item) {
            if (item.hasOwnProperty('append')) {
                return;
            }
            Object.defineProperty(item, 'append', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function append() {
                    var argArr = Array.prototype.slice.call(arguments);
                    var docFrag = document.createDocumentFragment();

                    argArr.forEach(function(argItem) {
                        var isNode = argItem instanceof Node;
                        docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                    });

                    this.appendChild(docFrag);
                }
            });
        });
    })([Element.prototype, Document.prototype, DocumentFragment.prototype]);





    /*****************************************************************
             * 
             * Socket error Handeling
             * 
             *****************************************************************/

    /* 
             * Connection errors
             */
    socket.on('connect_error', function socket_connect_error() {
        const errorEl = $$('.error:not(.reconnect)');
        if (errorEl.length > 0) {
            for (let i = 0; i < errorEl.length; i++) { errorEl[i].remove(); }
        }

        const HTML = `<li class="error">
                    <div class="who noselect who--smaller"><i class="material-icons">warning</i></div>
                    <div class="errorCont">Connection Error</div>
                </li>`;
        /* Display Error */
        appendDOM(HTML, '.panel--middle', true);
        $('#uc').innerHTML = 0;
    });
    socket.on('connect_failed', function socket_connect_failed() {
        const errorEl = $$('.error:not(.reconnect)');
        if (errorEl.length > 0) {
            for (let i = 0; i < errorEl.length; i++) { errorEl[i].remove(); }
        }

        const HTML = `<li class="error">
                    <div class="who noselect who--smaller"><i class="material-icons">warning</i></div>
                    <div class="errorCont">Connection Error</div>
                </li>`;
        /* Display Error */
        appendDOM(HTML, '.panel--middle', true);
        $('#uc').innerHTML = 0;
    });

    socket.on('connect_timeout', function socket_connect_timeout() {
        const errorEl = $$('.error:not(.reconnect)');
        if (errorEl.length > 0) {
            for (let i = 0; i < errorEl.length; i++) { errorEl[i].remove(); }
        }

        const HTML = `<li class="error">
                    <div class="who noselect who--smaller"><i class="material-icons">warning</i></div>
                    <div class="errorCont">Connection timeout</div>
                </li>`;
        /* Display Error */
        appendDOM(HTML, '.panel--middle', true);
        $('#uc').innerHTML = 0;
    });

    /* 
             * Reconnection errors
             */
    socket.on('reconnecting', function socket_reconnecting(at) {
        const errorEl = $$('.reconnect');
        const HTML = `<li class="error reconnect">
                    <div class="who noselect recAttemps">${at}/10</div>
                    <div class="errorCont">Reconnection attempt...</div>
                </li>`;
        /* Display Error */
        if (errorEl.length > 0) { $('.recAttemps').innerHTML = at + '/10'; } else { appendDOM(HTML, '.panel--middle', true); }
        $('#uc').innerHTML = 0;
    });
    socket.on('reconnect_failed', function socket_reconnect_failed() {
        const errorEl = $$('.reconnect');
        const HTML = `<li class="error reconnect">
            <div class="who noselect recAttemps"><i class="material-icons">error</i></div>
            <div class="errorCont">Reconnecting failed, <span class="man-rec">Click to reconnect manually</span></div>
        </li>`;
        /* Display Error */
        if (errorEl.length > 0) {
            $('.recAttemps').innerHTML = '';
            appendDOM('<i class="material-icons">error</i>', '.recAttemps');
            $('.reconnect .errorCont').innerHTML = '';
            appendDOM('Reconnecting failed, <span class="man-rec">Click to reconnect manually</span>', '.reconnect .errorCont');
        } else {
            appendDOM(HTML, '.panel--middle', true);
        }
    });

    socket.on('reconnect', function socket_reconnect() {
        const errorEl = $$('.error, .reconnect');
        if (errorEl.length > 0) {
            for (let i = 0; i < errorEl.length; i++) { errorEl[i].remove(); }
        }
        /* Alert users in room */
        socket.emit('userConnected', location.hash ? decodeURIComponent(location.hash.substring(2)) : null);
    });

    /* 
             * Invalid session logout
             */
    socket.on('invalidSession', function socket_invalidSession(status) {
        if (status) {
            socket.close();
            location.href = '/logout';
        }
    });

    /*****************************************************************
             * 
             * Send/receive messages
             * 
             *****************************************************************/

    window.onfocus = function() {
        /* Clear unread messages on focus */
        windowWasFocused();
    };


    /*
             * Receiveing messages
             */
    socket.on('message', function socket_message(data) {
        let message = data.message;
        const { mid, time, username } = data;
        /* Get links from message */
        const reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gim;
        /* Trim message */
        message = escapeHtml(message.trim());
        /* Replace links with anchors */
        let preparedText = message.replace(reg, '<a href="$1" target="_blank">$1</a>');
        /* Check from whom is the message and properly set class */
        const fromWho = username == Cookies.get('user') ? 'from__me' : 'to__me';
        const fromSelf = username == Cookies.get('user') ? '<div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>' : '';
        const fromSelfIcon = username == Cookies.get('user') ? '' : '<div class="who noselect" data-user="' + escapeHtml(username) + '">' + escapeHtml(username.substring(0, 1).toUpperCase()) + '</div>';
        /* Message template */
        const HTML = `<li class="ms ${fromWho}" data-mid="${escapeHtml(mid)}">
                <div class="time noselect">${time}</div>
                ${fromSelf}
                <div class="message">${preparedText}</div>
                ${fromSelfIcon}
            </li>;`;

        /* Remove user typing info */
        if ($$('.typing').length > 0) $('.typing').remove();

        /* Append message */
        appendDOM(HTML, '.panel--middle');
        twemoji.parse($('.panel--middle'));
        /* Show message */
        $(`.ms[data-mid="${mid}"]`).classList.add('transition-X');
        /* Detect if user scrolled up */
        tost(mid, username, message);
        /* Notify user */
        newNotf(username);
    });

    /* Send message by clicking send icon */
    $('.send').addEventListener('click', function send_click() { appendMessage(socket); });
    /* Sending message by clicking enter and sending typing info */
    $('.textField').addEventListener('keydown', function send_textField(e) {
        /* KeyCodes that generate fake typing (alt, shift, etc.) */
        const codes = [
            17,
            18,
            91,
            19,
            9,
            20,
            16,
            27,
            112,
            113,
            114,
            115,
            116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            8,
            45,
            46,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            93,
            13
        ];
        /* Send typing message if keycode was not found in array */
        if (codes.indexOf(e.keyCode) == -1) {
            socket.emit('typing', {
                user: Cookies.get('user')
            });
        }
        /* Send message when enter was hit without shift */
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            appendMessage(socket);
        }
    });

    /*
             * Send Emojis
             */
    document.addEventListener('click', function send_emojis(e) {
        if (e.target && hasClass(e.target, 'select__emoji') || hasClass(e.target.parentNode, 'select__emoji')) {
            const btn = hasClass(e.target, 'select__emoji') ? e.target : e.target.parentNode;
            let uniCode = btn.getAttribute('data-char');

            /* Insert emoji to text field */
            $('.textField').value += uniCode;
        } else if (e.target && hasClass(e.target, 'emojis')) {
            /* Display emojis */
            if ($('.sendEmoji').style['display'] == 'none') {
                $('.sendEmoji').style['display'] = 'flex';
                if ($$('.select__emoji').length < 5) {
                    /* Get emoji list */

                    send_message_to_sw('getEmojis').catch(() => {
                        setTimeout(function() {
                            fetch('/js/emoji.json', {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }).then(res => res.json()).then(emojis => {
                                $('.emojiList').innerHTML = '';
                                let list = '';
                                for (let i = 0; i < emojis.length; i++) {
                                    list += `<i class="select__emoji" data-keywords="${emojis[i].keywords}" data-char="${emojis[i].char}" data-index="${emojis[i].no}">${twemoji.parse(emojis[i].char)}</i>\n`;

                                }
                                appendDOM(list, '.emojiList', false);
                            }).catch(() => {
                                $('.emojiList').innerHTML = '';
                                appendDOM('<i class="material-icons noselect failed-to-fetch">warning</i>', '.emojiList', false);
                            });
                        }, 0);
                    });
                }
            } else {
                $('.sendEmoji').style['display'] = 'none';
            }
        } else if (e.target && !$('.sendEmoji').contains(e.target)) {
            /* Close emojis container */
            $('.sendEmoji').style['display'] = 'none';
        }
    });



    /*****************************************************************
             * 
             * Send/receive Images
             * 
             *****************************************************************/

    socket.on('file', function socket_image(file) {
        /* Get time */
        const time = getTime();

        const { username, mid, type, img, name } = file;

        /* Check from whom is the message */
        const fromWho = username == Cookies.get('user') ? 'from__me' : 'to__me';
        const fromSelf = username == Cookies.get('user') ? '<div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>' : '';
        const fromSelfIcon = username == Cookies.get('user') ? 'nodisplay' : '';
        /* File template */
        let media;
        if (type.indexOf('image') >= 0)
            media = `<div class="message message--image"><img data-type="${type}" data-name="${name}" src="data:${type};base64,${img}"></div>`;
        else if (type.indexOf('video') >= 0)
            media = `<div class="message message--video"><video controls data-type="${type}" data-name="${name}" type="${type}"></video></div>`;
        else if (type.indexOf('audio') >= 0)
            media = `<div class="message message--audio"><audio controls data-type="${type}" data-name="${name}" type="${type}"></audio></div>`;

        const HTML = `<li class="ms ${fromWho}" data-mid="${mid}">
                    <div class="time noselect">${time}</div>
                    ${fromSelf}\n
                    ${media}\n
                    <div class="who noselect ${fromSelfIcon}" data-user="${escapeHtml(username)}">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
                </li>`;
        /* Get actual image dimensions */
        const panelMiddle = $('.panel--middle');
        if (type.indexOf('image') >= 0) {
            getImageDimensions(`data:${type};base64,${img}`).then(dims => {
                /* Append message */
                appendDOM(HTML, '.panel--middle', false);
                /* Show message */
                $(`.ms[data-mid="${mid}"]`).classList.add('transition-X');
                /* Add image height to scroll bar */
                // middleDiv.scrollTop += dims.h;
                /* Detect if user scrolled up */
                if (panelMiddle.scrollTop + panelMiddle.clientHeight + (dims.h > 400 ? 400 : dims.h) > Math.max(
                    panelMiddle.scrollHeight,
                    panelMiddle.offsetHeight,
                    panelMiddle.clientHeight
                ) - 250) { panelMiddle.scrollTop = panelMiddle.scrollHeight + dims.h; }
                /* Tost */
                tost(mid, username, false);
            });
        } else if (type.indexOf('video') >= 0) {
            appendDOM(HTML, '.panel--middle', false);
            /* Show message */
            $(`.ms[data-mid="${mid}"]`).classList.add('transition-X');
            /* Add image height to scroll bar */
            // middleDiv.scrollTop += dims.h;
            let video = $(`.ms[data-mid="${mid}"] video`);
            video.src = `data:${type};base64,${img}`;
            video.onloadedmetadata = function() {
                /* Detect if user scrolled up */
                if (panelMiddle.scrollTop + panelMiddle.clientHeight + (video.videoHeight > 400 ? 400 : video.videoHeight) > Math.max(
                    panelMiddle.scrollHeight,
                    panelMiddle.offsetHeight,
                    panelMiddle.clientHeight
                ) - 250) { panelMiddle.scrollTop = panelMiddle.scrollHeight + 400; } else {
                    /* Tost */
                    tost(mid, username, false);
                }
            };
        } else if (type.indexOf('audio') >= 0) {
            appendDOM(HTML, '.panel--middle', false);
            /* Show message */
            $(`.ms[data-mid="${mid}"]`).classList.add('transition-X');
            /* Add image height to scroll bar */
            // middleDiv.scrollTop += dims.h;
            let audio = $(`.ms[data-mid="${mid}"] audio`);
            audio.src = `data:${type};base64,${img}`;
            audio.onloadedmetadata = function() {
                /* Detect if user scrolled up */
                if (panelMiddle.scrollTop + panelMiddle.clientHeight > Math.max(
                    panelMiddle.scrollHeight,
                    panelMiddle.offsetHeight,
                    panelMiddle.clientHeight
                ) - 250) { panelMiddle.scrollTop = panelMiddle.scrollHeight; } else {
                    /* Tost */
                    tost(mid, username, false);
                }
            };
        }

    });

    $('#sendFile').addEventListener('input', function send_file_input(e) {
        e.stopPropagation();
        e.preventDefault();
        let files = e.target.files;
        if (files.length < 5) {
            appendFile(socket, files);
            $('#sendFile').setAttribute('type', '');
            $('#sendFile').setAttribute('type', 'file');
        } else { error('Selected too many photos, limit is 4'); }
    }, false);

    $('.photo').addEventListener('click', function send_file_click() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            $('#sendFile').click();
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
    });

    $('.textField').addEventListener('paste', function send_file_paste(pasteEvent) {
        let items = pasteEvent.clipboardData.items;
        appendFile(socket, items, true);
    }, false);

    /*****************************************************************
             * 
             * Show image popup
             * 
             *****************************************************************/

    $('.panel--middle').addEventListener('click', function show_image_popup(e) {
        if (e.target && hasClass(e.target.parentNode, 'message--image')) {
            const data = e.target.getAttribute('src');
            const type = e.target.getAttribute('data-type');
            const name = e.target.getAttribute('data-name');
            const user = e.target.parentNode.parentNode.querySelector('.who').getAttribute('data-user');
            const mid = e.target.parentNode.parentNode.getAttribute('data-mid');
            const fileSize = (data.length * (3 / 4)) - (data[data.length - 3] + data[data.length - 2] == '==' ? 2 : data[data.length - 2] == '=' ? 1 : 0);
            const HTML = `<div class="modal__div" data-mid="${mid}">
                        <div class="gallery__cont">
                            <div class="modal__exit noselect"><i class="material-icons">close</i></div>
                            <div class="gallery__download noselect" data-type="${type}" data-name="${name}"><i class="material-icons">save</i></div>
                            <div class="modal__fileinfo">${formatSizeUnits(fileSize)}</div>
                            <div class="who noselect modal__who">${user.substring(0, 1).toLowerCase()}</div>
                            <div class="img__div">
                                <img class="gallery__img">
                            </div>
                        </div>
                    </div>`;
            appendDOM(HTML, 'body');
            $('.modal__div').classList.add('anim--opacity');
            $('.gallery__cont').classList.add('anim--opacity');
            $('.img__div').classList.add('anim--scale');
            $('.gallery__img').src = data;
        }
    });

    /*****************************************************************
             * 
             * Disable sending fake reconnect signals on blur
             * 
             *****************************************************************/

    window.addEventListener('focus', function win_focus() {
        $('.textField').focus();
        socket.io.reconnection(true);
        socket.io._reconnectionAttempts = 10;
        socket.io.open(function() {
            if (socket.io.readyState == 'open') {
                const errorEl = $$('.error, .reconnect');
                if (errorEl.length > 0) {
                    for (let i = 0; i < errorEl.length; i++) { errorEl[i].remove(); }
                    socket.emit('userConnected', location.hash ? decodeURIComponent(location.hash.substring(2)) : null);
                }
            }
        });
    });
    window.addEventListener('blur', function win_blur() {
        socket.io._reconnectionAttempts = 0;
    });

    /*****************************************************************
             * 
             * Clear your local chat history
             * 
             *****************************************************************/

    $('.clear_chat').addEventListener('click', function clear_chat() {
        const messages = $$('.panel--middle li');
        revSelectedIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            const t = messages.length < 300 ? ((messages.length - 1) * 5) - (5 * i) : 0;
            let ms = messages[i];
            setTimeout(function() {
                ms.classList.add('transition-leave');
                setTimeout(function() {
                    ms.remove();
                }, 300);
            }, t);
        }
    });

    /*****************************************************************
             * 
             * Send image by dropping file on dropImage element
             * 
             *****************************************************************/

    const dropImage = $$('.panel--bottom, .panel--middle');
    for (let i = 0; i < dropImage.length; i++) {
        dropImage[i].addEventListener('dragover', function send_image_dragover(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
            $('.textField').setAttribute('placeholder', 'Drop image');
            $('.panel--bottom').style.background = '#454d6f';
        }, false);
        dropImage[i].addEventListener('dragleave', function send_image_leave(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            $('.panel--bottom').removeAttribute('style');
            $('.textField').setAttribute('placeholder', 'Type message here');
        }, false);
        dropImage[i].addEventListener('drop', function send_image_drop(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            let files = evt.dataTransfer.files;
            $('.panel--bottom').removeAttribute('style');
            $('.textField').setAttribute('placeholder', 'Type message here');
            appendFile(socket, files);
        }, false);
    }


    /*****************************************************************
             * 
             *  Delete sent messages
             * 
             *****************************************************************/
    let revSelectedIndex = -1;
    $('.panel--middle').addEventListener('click', function delete_sent_messages(e) {
        if (e.target && hasClass(e.target, 'reverse') || hasClass(e.target.parentNode, 'reverse')) {
            const messageDiv = hasClass(e.target.parentNode, 'reverse') ? e.target.parentNode.parentNode : e.target.parentNode;
            const mid = messageDiv.getAttribute('data-mid');
            if (e.ctrlKey) {
                if (typeof messageDiv.getAttribute('data-selected') === undefined || messageDiv.getAttribute('data-selected') == null) {
                    messageDiv.classList.add('toDelete');
                    messageDiv.setAttribute('data-selected', mid);
                    const nodes = Array.prototype.slice.call($$('.from__me'));
                    const liRef = messageDiv;
                    revSelectedIndex = nodes.indexOf(liRef);
                } else {
                    messageDiv.classList.remove('toDelete');
                    messageDiv.removeAttribute('data-selected');
                    if ($$('.from__me[data-selected]').length === 0) revSelectedIndex = -1;
                }
            } else if (e.shiftKey && revSelectedIndex != -1) {
                messageDiv.setAttribute('data-selected', mid);
                const nodes = Array.prototype.slice.call($$('.from__me'));
                const liRef = messageDiv;
                const index = nodes.indexOf(liRef);
                if (index > revSelectedIndex) {
                    for (let i = revSelectedIndex; i <= index; i++) {
                        $$('.from__me')[i].classList.add('toDelete');
                        $$('.from__me')[i].setAttribute('data-selected', $$('.from__me')[i].getAttribute('data-mid'));
                    }
                } else {
                    for (let i = revSelectedIndex; i >= index; i--) {
                        $$('.from__me')[i].classList.add('toDelete');
                        $$('.from__me')[i].setAttribute('data-selected', $$('.from__me')[i].getAttribute('data-mid'));
                    }
                }
            } else {
                if ($$('.from__me[data-selected]').length > 0) {
                    messageDiv.setAttribute('data-selected', mid);
                    for (let i = 0; i < $$('.from__me[data-selected]').length; i++) { socket.emit('reverseMessage', $$('.from__me[data-selected]')[i].getAttribute('data-selected')); }
                } else {
                    socket.emit('reverseMessage', mid);
                }
                revSelectedIndex = -1;
            }
        }
    });

    socket.on('reverseMessage', function socket_reverseMessage(mid) {
        const ms = $$(`[data-mid="${mid}"]`);
        for (let i = 0; i < ms.length; i++) {
            let mess = ms[i];
            if (typeof mess !== undefined && mess != null) {
                for (let i = 0; i < $$('.from__me[data-selected]').length; i++) {
                    $$('.from__me[data-selected]')[i].classList.remove('toDelete');
                    $$('.from__me[data-selected]')[i].removeAttribute('data-selected');
                }
                if (hasClass(mess, 'modal__div')) {
                    $('.gallery__cont').classList.remove('anim--opacity');
                    $('.img__div').classList.remove('anim--scale');
                    $('.modal__div').classList.remove('anim--opacity');
                    setTimeout(function remove_image_popup() {
                        mess.remove();
                    }, 200);
                }
                setTimeout(function remove_message() {
                    if (hasClass(mess, 'from__me')) {
                        if (mess.querySelector('.reverse')) { mess.querySelector('.reverse').remove(); }
                        mess.querySelector('.message').innerHTML = 'You removed a message';
                    } else {
                        mess.querySelector('.message').innerHTML = 'Message removed';
                    }
                    mess.classList.add('ms--removed');
                    mess.querySelector('.message').classList.remove('message--image');
                    mess.querySelector('.message').classList.remove('message--video');
                    mess.querySelector('.message').classList.remove('message--audio');
                    mess.querySelector('.message').classList.add('italic');
                    mess.querySelector('.message').classList.add('noselect');
                }, 200);
            }
        }
    });

    /*****************************************************************
             *  
             *  User typing notification
             *  ::TODO
             *****************************************************************/
    let userTyping = [];
    let timeout;
    socket.on('typing', function socket_typing(mid) {
        const midPos = userTyping.indexOf(mid.user);
        if (midPos == -1) {
            userTyping.push(mid.user);
        }
        if ($$('.typing').length > 0) $('.typing').remove();
        const HTML = `<li class="typing">
                     <div class="usersTyping">
                        ${
    (function () {
        let uTyping = '';
        for (let i = 0; i < userTyping.length; i++) {
            uTyping += `<div class="who who-typer" data-user="${escapeHtml(userTyping[i])}" title="${escapeHtml(userTyping[i])}">${escapeHtml(userTyping[i].substring(0, 1).toUpperCase())}</div>`;
        }
        return uTyping;
    })()
} 
                    <span>typing</span>
                </div>
            </li>`;
        appendDOM(HTML, '.panel--middle', false);
        clearTimeout(timeout);
        timeout = setTimeout(function remove_typing () {
            const el = $$('.who-typer');
            for (let i = 0; i < el.length; i++) {
                const user = el[i].getAttribute('data-user');
                userTyping.splice(userTyping.indexOf(user), 1);
            }
            if ($$('.typing').length > 0) $('.typing').remove();
        }, 1500);
    });

    /*****************************************************************
     * 
     *  Manage your sessions, popups
     * 
     *****************************************************************/

    socket.on('activeSessions', function socket_activeSessions (data) {
        const sessions = $$('li[data-socketid]');
        for (let i = 0; i < sessions.length; i++) { sessions[i].remove();}
        if ($$('.activeSessions').length > 0) {
            for (let i = 0; i < data.length; i++) {
                appendDOM(
                    `<li data-socketid="${data[i].socketId}">
                        <span class="session--id">${(typeof socket !== undefined && data[i].socketId == socket.id) ? 'This device' : data[i].os}</span>
                        <span class="session--time">${data[i].lastAccess}</span>
                        <span class="remove--session__span remove--session"><i class="material-icons">close</i></span>
                    </li>`,
                    '.activeSessions'
                );
            }
        }
    });
    if ($$('.settings--popup').length > 0) {
        $('.settings--popup').addEventListener('click', function settings_popup_click () {
            socket.emit('activeSessions', true, function socket_activeSessions_popup (data) {
                const sessions = $$('.session__li');
                for (let i = 0; i < sessions.length; i++) { sessions[i].remove();}
                appendDOM(`<li class="noselect">
                            <span>Device</span>
                            <span class="session--time">First seen</span>
                            <span class="remove--session__span"><i class="material-icons">close</i></span>
                        </li>`, '.activeSessions');
                for (let i = 0; i < data.length; i++) {
                    appendDOM(
                        `<li class="session__li" data-socketid="${data[i].socketId}">
                        <span class="session--id">${(typeof socket !== undefined && data[i].socketId == socket.id) ? 'This device' : data[i].os}</span>
                        <span class="session--time">${data[i].lastAccess}</span>
                        <span class="remove--session__span remove--session"><i class="material-icons">close</i></span>
                    </li>`,
                        '.activeSessions'
                    );
                }
            });
        });
    }
    document.addEventListener('click', function doc_click (e) {
        if (e.target && hasClass(e.target, 'tost') || hasClass(e.target.parentNode, 'tost')) {
            middleDiv.scrollTop = middleDiv.scrollHeight;
            if (hasClass(e.target, 'tost')) e.target.classList.add('tost-leave');
            else e.target.parentNode.classList.add('tost-leave');
            setTimeout(function tost_remove () {
                if (hasClass(e.target, 'tost')) e.target.remove();
                else e.target.parentNode.remove();
            }, 300);
        } else if (e.target && hasClass(e.target, 'modal__exit') || hasClass(e.target.parentNode, 'modal__exit')) {
            $('.gallery__cont').classList.remove('anim--opacity');
            $('.img__div').classList.remove('anim--slideUp');
            $('.img__div').classList.remove('anim--scale');
            $('.modal__div').classList.remove('anim--opacity');
            for (let i = 0; i < $$('.room--change').length; i++) {
                $$('.room--change')[i].removeAttribute('style');
            }
            setTimeout(function modal_exit () {
                $('.modal__div').remove();
            }, 300);
        } else if (e.target && hasClass(e.target, 'gallery__download') || hasClass(e.target.parentNode, 'gallery__download')) {
            const btn = hasClass(e.target, 'gallery__download') ? e.target : e.target.parentNode;
            const type = btn.getAttribute('data-type');
            const name = btn.getAttribute('data-name');
            const image = btn.parentNode.querySelector('.gallery__img').src;
            fetch(image)
                .then(res => res.blob())
                .then(blob => {
                    const anchor = document.createElement('a');
                    anchor.download = name;
                    anchor.href = window.URL.createObjectURL(blob);
                    anchor.dataset.downloadurl = [type + ';charset=utf8', anchor.download, anchor.href].join(':');
                    anchor.click();
                });
        } else if (e.target && hasClass(e.target, 'remove--session') || hasClass(e.target.parentNode, 'remove--session')) {
            const btn = hasClass(e.target.parentNode, 'remove--session') ? e.target.parentNode : e.target;
            const socketId = btn.parentNode.getAttribute('data-socketid');
            socket.emit('removeSession', socketId, function socket_EmitRemoveSession (data) {
                const sessions = $$('.session__li');
                for (let i = 0; i < sessions.length; i++) { sessions[i].remove();}
                for (let i = 0; i < data.length; i++) {
                    appendDOM(
                        `<li class="session__li" data-socketid="${data[i].socketId}">
                            <span class="session--id">${(typeof socket !== undefined && data[i].socketId == socket.id) ? 'This device' : data[i].os}</span>
                            <span class="session--time">${data[i].lastAccess}</span>
                            <span class="remove--session__span remove--session"><i class="material-icons">close</i></span>
                        </li>`,
                        '.activeSessions'
                    );
                }
            });
        } else if (e.target && (hasClass(e.target, 'room--change') || hasClass(e.target.parentNode, 'room--change') || hasClass(e.target.parentNode.parentNode, 'room--change'))) {
            const btn = hasClass(e.target.parentNode, 'room--change') ? e.target.parentNode : hasClass(e.target.parentNode.parentNode, 'room--change') ? e.target.parentNode.parentNode : e.target;
            if (!hasClass(btn, 'room--active')) {
                const rid = btn.getAttribute('data-rid');
                location.hash = `/${encodeURIComponent(rid)}`;
                if ($$('.panel--middle li').length > 0 && hasClass($$('.panel--middle li')[$$('.panel--middle li').length - 1], 'info--change')) { $$('.panel--middle li')[$$('.panel--middle li').length - 1].remove();}
                if ($('.modal__div')) {
                    $('.settings__cont').classList.remove('anim--opacity', 'anim--scale');
                    $('.modal__div').classList.remove('anim--opacity');
                    setTimeout(function () {
                        $('.modal__div').remove();
                    }, 300);
                }
            }
        } else if (e.target && hasClass(e.target, 'changeRoom') || hasClass(e.target.parentNode, 'changeRoom')|| hasClass(e.target.parentNode.parentNode, 'changeRoom')) {
            const HTML = `<div class="modal__div">
                            <div class="settings__cont rooms__cont">
                                <div class="settings__exit noselect"><i class="material-icons">close</i></div>
                                <div class="title noselect">Rooms</div>
                                <p class="description noselect">Change chat room.</p>
                                <div class="subtitle noselect">Available rooms</div>
                                <div class="search--room">
                                    <i class="material-icons noselect">search</i>
                                    <input type="search" name="searchRoom" placeholder="Search room">
                                </div>
                                <ul class="rooms noselect rooms--modal"></ul>
                                <div class="footer">
                                    <div class="branding noselect">1.1.1</div>
                                    <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                                </div>
                            </div>
                        </div>`;
            appendDOM(HTML, 'body', false);
            $('.modal__div').classList.add('anim--opacity');
            $('.settings__cont').classList.add('anim--opacity', 'anim--slideUp');
            socket.emit('roomList', true);
        } else if (e.target && hasClass(e.target, 'addRoom')) {
            const HTML = `<div class="modal__div">
                            <div class="settings__cont rooms__cont">
                                <div class="settings__exit noselect"><i class="material-icons">close</i></div>
                                <div class="title noselect">Add chat room</div>
                                <p class="description noselect"></p>
                                <div class="subtitle noselect">Name</div>
                                <div class="input__div">
                                    <div class="input__div--wrapper">
                                        <input type="text" name="roomName" placeholder="Type new room name">
                                    </div>    
                                </div>
                                <div class="subtitle noselect">Select icon</div>
                                <div class="input__div">
                                    <div class="room__icons">
                                        <div class="lds-roller">
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="subtitle noselect">Preview</div>
                                <div class="input__div">
                                    <div class="chat--prev"><i class="icon--prev">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</i><span class="room--name--prev">name</span></div>
                                </div>
                                <div class="input__div">
                                    <button class="create--room">Create<i class="material-icons">add</i></button>
                                </div>
                                <div class="footer">
                                    <div class="branding noselect">1.1.1</div>
                                    <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                                </div>
                            </div>
                        </div>`;
            appendDOM(HTML, 'body', false);
            fetch('/js/emojis.json', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(emojis => {
                // $('.room__icons').innerHTML = '';
                // let list = '';
                // for (let key in emojis) {
                //     const emoji = emojis[key];
                //     /* Get UTF-8 emoji */
                //     list+=`<i class="select__icon" data-char="${emoji['char']}" data-index="${key}">${twemoji.parse(emoji['char'])}</i>`;
                // }
                // appendDOM(list, '.room__icons', false);                
                $('.emojiList').innerHTML = '';
                let list = '';
                emojis.forEach((el)=>{
                    const emoji = el;
                    /* Get UTF-8 emoji */
                    console.log(emoji.char);
                    list += `<i class="select__emoji" data-keywords="${emoji.keywords}" data-char="${emoji.char}" data-index="${el.no}">${twemoji.parse(emoji.char)}</i>`;
                });
                // for (let key in event.data.emojis) {
                    
                // }
                appendDOM(list, '.emojiList', false);
            }).catch(() => {
                $('.room__icons').innerHTML = '';
                appendDOM('<i class="material-icons noselect failed-to-fetch">warning</i>', '.room__icons');
            });
        
            $('.modal__div').classList.add('anim--opacity');
            $('.settings__cont').classList.add('anim--opacity', 'anim--scale');
        } else if (e.target && hasClass(e.target, 'select__icon') || hasClass(e.target.parentNode, 'select__icon')) {
            const btn = hasClass(e.target, 'select__icon')?e.target:e.target.parentNode;
            const icons = $$('.select__icon');
            for (let i = 0; i < icons.length; i++) { icons[i].classList.remove('icon--active');}
            btn.classList.add('icon--active');
            $('.icon--prev').innerHTML = twemoji.parse(btn.innerHTML);        
        } else if (e.target && hasClass(e.target, 'man-rec')) {
            socket.io.reconnection(true);
            socket.io._reconnectionAttempts = 10;
            socket.io.open(function() {
                if (socket.io.readyState == 'open') {
                    const errorEl = $$('.error, .reconnect');
                    if (errorEl.length > 0) {
                        for (let i = 0; i < errorEl.length; i++) { errorEl[i].remove(); }
                        socket.emit('userConnected', location.hash ? decodeURIComponent(location.hash.substring(2)) : null);
                    }
                }
            });
        }
    });

    /*****************************************************************
 *  
 *  User join/leave/rooms
 * 
 *****************************************************************/

    socket.on('roomList', function socket_roomList (list) {
        for (let r = 0; r < $$('.rooms').length; r++) { $$('.rooms')[r].innerHTML = ''; }
        let roomsList ='';
        for (let i = 0; i < list.length; i++) {
            let uniCode = list[i].icon;
            const activeRoom = location.hash ? decodeURIComponent(location.hash.substring(2)) == list[i].id ? 'room--active' : '' : i == 0 ? 'room--active' : '';
            roomsList += `<li class="room--change ${activeRoom}" data-icon="${uniCode}" data-rid="${list[i].id}"><i>${twemoji.parse(uniCode)}</i> <div class="room--details">${list[i].name} <div class="room--count">Online: ${list[i].online}</div></div></li>\n`;
        }
        appendDOM(roomsList, '.rooms', false);        
        // $('.rooms'));
        if ($('.rooms--modal')) {
            let roomsList ='';
            for (let i = 0; i < list.length; i++) {
                let uniCode = list[i].icon;
                const activeRoom = location.hash ? decodeURIComponent(location.hash.substring(2)) == list[i].id ? 'room--active' : '' : i == 0 ? 'room--active' : '';
                roomsList += `<li class="room--change ${activeRoom}" data-icon="${uniCode}" data-rid="${list[i].id}"><i>${twemoji.parse(uniCode)}</i> <div class="room--details">${list[i].name} <div class="room--count">Online: ${list[i].online}</div></div></li>\n`;
            }
            appendDOM(roomsList, '.rooms--modal', false);
        }
    });

    socket.on('userConnected', function socket_userConnected (data) {
        if (data.joined != Cookies.get('clientId')) {
            const time = getTime();
            const HTML = `<li class="joined"><span class="line"></span><span>${escapeHtml(data.username)} ${data.status ? 'joined chat' : 'left chat'} - ${time}</span><span class="line"></span></li>`;
            appendDOM(HTML, '.panel--middle', true);
        } else {
            if (!location.hash) {
                if(data.roomIcon){
                    $('.rooms--title').innerHTML = ''; 
                    let uniCode = twemoji.parse(data.roomIcon);
                    appendDOM(`<i>${uniCode}</i> <span>${data.roomName}</span>`, '.rooms--title', true);
                }
            }
        }
        $('#uc').innerHTML = data.users;
        socket.emit('roomList', true);
    });
    socket.on('changeRoom', function socket_changeRoom (rid) {
        location.hash = `/${rid}`;
    });
    if (location.hash) {
        let hash = location.hash;
        let rid = decodeURIComponent(hash.substring(2));
        socket.emit('changeRoom', rid, function socket_EmitChangeRoom (roomInfo) {
            if (rid !== roomInfo.id) {
                location.hash = `/${roomInfo.id}`;
            } else {
                $('.rooms--title').innerHTML = ''; 
                let uniCode = twemoji.parse(roomInfo.icon);
                appendDOM(`<i>${uniCode}</i> <span>${roomInfo.name}</span>`, '.rooms--title');
                appendDOM(
                    `<li class="info--change">
                    <div class="noselect info--room"><i>${uniCode}</i></div>
                    <div class="info--changeCont">Joined "${roomInfo.name}"</div>
                </li>`, 
                    '.panel--middle', true
                );
            }
        });
    } else {
        socket.emit('userConnected', null);
    }
    window.addEventListener('hashchange', function win_hashchange () {
        let hash = location.hash;
        let rid = decodeURIComponent(hash.substring(2));
        const rooms = $$('.room--change');
        for (let i = 0; i < rooms.length; i++) {
            rooms[i].classList.remove('room--active');
        }
        const selRooms = $$(`.room--change[data-rid="${rid}"]`);
        for (let i = 0; i < selRooms.length; i++) {
            selRooms[i].classList.add('room--active');
        }        
        socket.emit('changeRoom', rid, function socket_EmitChangeRoom2 (roomInfo) {
            if (rid !== roomInfo.id) {
                location.hash = `/${roomInfo.id}`;
            } else {
                socket.emit('roomList', true);
                $('.rooms--title').innerHTML = '';        
                let uniCode = twemoji.parse(roomInfo.icon);
                appendDOM(`<i>${uniCode}</i> <span>${roomInfo.name}</span>`, '.rooms--title');
                appendDOM(
                    `<li class="info--change">
                    <div class="noselect info--room"><i>${uniCode}</i></div>
                    <div class="info--changeCont">Joined "${roomInfo.name}"</div>
                </li>`, 
                    '.panel--middle'
                );
            }
        });
    }, false);

    document.addEventListener('input', function (e) {
        if(e.target && e.target.getAttribute('name') == 'searchRoom'){
            e.preventDefault();
            let rooms = $$('.room--change');
            let val = e.target.value.trim().toLowerCase();
            if (val.length != 0 || val != '') {
                for (let i = 0; i < rooms.length; i++) {
                    if (rooms[i].querySelector('.room--details').innerText.toLowerCase().replace(/online:\s\d+/g).indexOf(val) == -1) {
                        rooms[i].style.display = 'none';
                    } else {
                        rooms[i].removeAttribute('style');
                    }
                }
            } else {
                for (let i = 0; i < rooms.length; i++) {
                    rooms[i].removeAttribute('style');
                }
            } 
        }
    });


    if(!Cookies.get('clientId') || !Cookies.get('user'))
        location.href = '/logout';

        

    /*****************************************************************
     *  
     *  Service worker
     * 
     *****************************************************************/

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (r) {
            console.log('SW scope:', r.scope);
            console.log('ServiceWorker zarejestrowany.');
        }).catch(function (e) {
            console.log('Ups! Błąd przy rejestracji ServiceWorkera! ' + e);
        });
        navigator.serviceWorker.addEventListener('message', function(event){
            if(event.data.what == 'getEmojis'){
                $('.emojiList').innerHTML = '';
                let list = '';                          
                for (let i=0;i<event.data.emojis.length;i++) {
                    list += `<i class="select__emoji" data-keywords="${event.data.emojis[i].keywords}" data-char="${event.data.emojis[i].char}" data-index="${event.data.emojis[i].no}">${twemoji.parse(event.data.emojis[i].char)}</i>\n`;

                }
                appendDOM(list, '.emojiList', false);
            }
        });
    }

    /*****************************************************************
     *  
     *  Loading emojis font, 
     * 
     *****************************************************************/

    
    $('input[name="searchEmoji"]').addEventListener('input', function(e) {
        let val = e.target.value;
        val = val.toLowerCase().trim();
        let emjs = $$('.select__emoji');
        if(val.length > 0){
            const reg = new RegExp(val, 'g');
            for(let i = 0; i< emjs.length;i++){
                if(emjs[i].getAttribute('data-keywords').match(reg))
                    emjs[i].style.display= 'block';
                else
                    emjs[i].style.display= 'none';
            }
        } else {
            for(let i = 0; i< emjs.length;i++){
                emjs[i].style.display= 'block';
            }
        }
        // twemoji.parse($('.sendEmoji'));
        // emojis = emojis.filter();
    });
    if ($$('.settings--popup').length > 0) {
        $('.settings--popup').addEventListener('click', openSettings);
        document.addEventListener('click', operations, false);
        document.addEventListener('input', settingsInput, false);
    }
    
    function send_message_to_sw(msg){
        return new Promise(function(resolve, reject){
            // Create a Message Channel
            var msg_chan = new MessageChannel();
    
            // Handler for recieving message reply from service worker
            msg_chan.port1.onmessage = function(event){
                if(event.data.error){
                    reject(event.data.error);
                }else{
                    resolve(event.data);
                }
            };
    
            // Send message to service worker along with port for reply
            navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
        });
    }
});