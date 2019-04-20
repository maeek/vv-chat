/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.5
 * 
 */

const domFromText = html => new DOMParser().parseFromString(html, 'text/html').body.childNodes;
let sound = new Audio();
sound.src = "/static/pull-out.ogg"

const $ = element => document.querySelector(element);
const $$ = element => document.querySelectorAll(element);
const hasClass = (elem, cls) => {
    if (!('className' in elem)) return;
    return !!elem.className.match(new RegExp("\\b" + cls + "\\b"));
};
const getImageDimensions = file => new Promise(function(resolved) {
    var i = new Image()
    i.onload = function() {
        resolved({ w: i.width, h: i.height })
    };
    i.src = file
});

function formatSizeUnits(bytes) {
    if (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; } else if (bytes >= 1048576) { bytes = (bytes / 1048576).toFixed(2) + " MB"; } else if (bytes >= 1024) { bytes = (bytes / 1024).toFixed(2) + " KB"; } else if (bytes > 1) { bytes = bytes + " bytes"; } else if (bytes == 1) { bytes = bytes + " byte"; } else { bytes = "0 bytes"; }
    return bytes;
}

function appendDOM(HTML, element = String, scroll = true) {
    const childNodes = domFromText(HTML);
    const middleDiv = $(".panel--middle");
    if ($$(".typing").length > 0) $(".typing").remove();

    for (var i = 0; i < childNodes.length; i++) {
        $(element).append(childNodes[i]);
    }
    if (middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
            middleDiv.scrollHeight,
            middleDiv.offsetHeight,
            middleDiv.clientHeight,
        ) - 250 && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }
}

let errTim;

function error(message, timeout = 2000) {
    const errID = "errID-" + randomString();
    const HTML = `<div data-eid="${errID}" class="tost tost--error noselect">Error: ${message}</div>`;
    if ($$(".tost").length > 0) $(".tost").remove();
    appendDOM(HTML, 'body');
    $(".tost").classList.add("tost-enter");
    clearTimeout(errTim);
    errTim = setTimeout(function() {
        $(`.tost[data-eid="${errID}"]`).classList.remove("tost-enter");
        $(`.tost[data-eid="${errID}"]`).classList.add("tost-leave");
        setTimeout(function() {
            $(`.tost[data-eid="${errID}"]`).remove();
        }, 300);

    }, timeout);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function randomString(length = 15) {
    const chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    let string = "";
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}

let unread = 0;

function newNotf(user, image = false) {
    const title = "VV-Chat";
    document.title = `${escapeHtml(user.toUpperCase())} sent${(image)?" photo":" message"}`;
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
            if (!localStorage.getItem("disableVibration"))
                navigator.vibrate(150);
        }
        if (!localStorage.getItem("mute")) {
            sound.src = "/static/pull-out.ogg";
            sound.play();
        }
    } catch (e) {
        return false;
    }
}
window.onfocus = function() {
    unread = 0;
    document.title = `VV-Chat`;
}

window.addEventListener("DOMContentLoaded", function() {
    if ($$(".settings--popup").length > 0) {
        $(".settings--popup").addEventListener("click", function() {
            const HTML = `<div class="modal__div">
                            <div class="settings__cont">
                                <div class="settings__exit noselect"><i class="material-icons">close</i></div>
                                <div class="title noselect">Settings</div>
                                <p class="description noselect">Change settings for your account.</p>
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
                                            <input type="password" name="resetPasswordOld" placeholder="Type old password">
                                        </div>    
                                    <div class="input__div--wrapper">
                                        <input type="password" name="resetPassword" placeholder="Type new password, at least 5 characters">
                                        <i class="material-icons noselect change--password">done</i>
                                    </div>
                                    <div class="status__div"></div>
                                </div>
                                <div class="footer">
                                    <div class="branding noselect">1.0.5</div>
                                    <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                                </div>
                            </div>
                        </div>`;
            appendDOM(HTML, 'body', false);
            if (localStorage.getItem("mute"))
                $(".mute").checked = true;
            if (localStorage.getItem("disableVibration"))
                $(".disableVibration").checked = true;
            $(".modal__div").classList.add("anim--opacity");
            $(".settings__cont").classList.add("anim--opacity", "anim--scale");
        });
        document.addEventListener('click', function(e) {
            if (e.target && hasClass(e.target, 'settings__exit') || hasClass(e.target.parentNode, 'settings__exit')) {

                $(".settings__cont").classList.remove("anim--opacity", "anim--scale");
                $(".modal__div").classList.remove("anim--opacity");
                setTimeout(function() {
                    $(".modal__div").remove();
                }, 300);
            } else if (e.target && hasClass(e.target, 'change--password')) {
                const oldPassDiv = e.target.parentNode.parentNode.querySelector("input[name='resetPasswordOld']");
                const newPassDiv = e.target.parentNode.querySelector("input[name='resetPassword']");
                if (newPassDiv.value.length > 4) {
                    fetch("/setup", {
                        body: JSON.stringify({
                            oldPassword: oldPassDiv.value.trim(),
                            password: newPassDiv.value.trim()
                        }),
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        method: "POST"
                    }).then(res => res.json()).then(data => {
                        if (data.status) {
                            $(".status__div").classList.remove("statusError");
                            $(".status__div").classList.add("statusSuccess");
                            $(".status__div").innerHTML = `Password updated`;
                            newPassDiv.value = "";
                            oldPassDiv.value = "";
                        } else {
                            $(".status__div").classList.remove("statusSuccess");
                            $(".status__div").classList.add("statusError");
                            $(".status__div").innerHTML = `Failed to update password`;
                        }
                    });
                } else {
                    $(".status__div").classList.remove("statusSuccess");
                    $(".status__div").classList.add("statusError");
                    $(".status__div").innerHTML = `Password to short`;
                }
            }
        });

        document.addEventListener('input', function(e) {
            if (e.target && hasClass(e.target, 'mute')) {
                const mute = e.target.checked;
                if (mute)
                    localStorage.setItem("mute", true);
                else
                    localStorage.removeItem("mute");
            } else if (e.target && hasClass(e.target, 'disableVibration')) {
                const vibe = e.target.checked;
                if (vibe) {
                    localStorage.setItem("disableVibration", true);
                } else {
                    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
                    if (navigator.vibrate) {
                        navigator.vibrate(100);
                    }
                    localStorage.removeItem("disableVibration");
                }
            }

        });
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function(r) {
        console.log("SW scope:", r.scope);
        console.log('ServiceWorker zarejestrowany.')
    }).catch(function(e) {
        console.log('Ups! Błąd przy rejestracji ServiceWorkera! ' + e)
    });
}