/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
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
const getTime = () => new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toJSON().substring(10, 19).replace('T', ' ');

function formatSizeUnits(bytes) {
    if (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; } else if (bytes >= 1048576) { bytes = (bytes / 1048576).toFixed(2) + " MB"; } else if (bytes >= 1024) { bytes = (bytes / 1024).toFixed(2) + " KB"; } else if (bytes > 1) { bytes = bytes + " bytes"; } else if (bytes == 1) { bytes = bytes + " byte"; } else { bytes = "0 bytes"; }
    return bytes;
}

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
                var argArr = Array.prototype.slice.call(arguments),
                    docFrag = document.createDocumentFragment();

                argArr.forEach(function(argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.appendChild(docFrag);
            }
        });
    });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);

function appendDOM(HTML, element, scroll) {
    scroll = !scroll ? true : false;
    const childNodes = domFromText(HTML);
    const middleDiv = $(".panel--middle");
    if ($$(".typing").length > 0) $(".typing").remove();

    for (let i = 0; i < childNodes.length; i++) {
        $(element).append(childNodes[i]);
    }

    if ((middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
            middleDiv.scrollHeight,
            middleDiv.offsetHeight,
            middleDiv.clientHeight
        ) - 250) && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
        // const panel = $(".panel--middle");
        // const pwh = $(".page__wrapper").clientHeight;
        // const pcalc = pwh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
        // panel.style["height"] = pcalc + "px";
    }

}

let errTim;

function error(message, timeout) {
    timeout = !timeout ? 2000 : timeout;
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

function randomString(length) {
    length = !length ? 15 : length;
    const chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    let string = "";
    for (let i = 0; i < length; i++) {
        string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
}

let unread = 0;

function newNotf(user, image) {
    image = image ? true : false;
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
            if (!window.localStorage.getItem("disableVibration"))
                navigator.vibrate(150);
        }
        if (!window.localStorage.getItem("mute")) {
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
                                <p class="description noselect">Change settings for your account - ${Cookies.get("user")}</p>
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
            if (window.localStorage.getItem("mute"))
                $(".mute").checked = true;
            if (window.localStorage.getItem("disableVibration"))
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
            } else if (e.target && hasClass(e.target, 'wrap--aside') || hasClass(e.target.parentNode, 'wrap--aside')) {
                if ($("aside").getAttribute("data-hidden") == "yes") {
                    $("aside").style.flex = "0 0 250px";
                    $("aside").setAttribute("data-hidden", "no");
                } else {
                    $("aside").style.flex = "0 0 0";
                    $("aside").setAttribute("data-hidden", "yes");
                }
            }
        }, false);

        document.addEventListener('input', function(e) {
            if (e.target && hasClass(e.target, 'mute')) {
                const mute = e.target.checked;
                if (mute)
                    window.localStorage.setItem("mute", true);
                else
                    window.localStorage.removeItem("mute");
            } else if (e.target && hasClass(e.target, 'disableVibration')) {
                const vibe = e.target.checked;
                if (vibe) {
                    window.localStorage.setItem("disableVibration", true);
                } else {
                    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
                    if (navigator.vibrate) {
                        navigator.vibrate(100);
                    }
                    window.localStorage.removeItem("disableVibration");
                }
            }

        }, false);
    }
    const emojis = new FontFace("KoHo", "url(/css/fonts/emoji.ttf)", {
        style: 'normal',
        unicodeRange: 'U+2700-27BF, U+1F300-1F5FF, U+1F900-1F9FF, U+1F600-1F64F, U+1F680-1F6FF, U+2600-26FF, U+1f1e6-1f251',
        weight: '400'
    });
    const loadedFont = emojis.load();
    loadedFont.then(function(loaded_font) {
        // apply the font (which may rerender text and cause a page reflow)
        // once the font has finished downloading
        document.fonts.add(loaded_font);
        document.body.style.fontFamily = "KoHo, sans-serif";
    }).catch(e => console.log("Not supported"));
});


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: "/" }).then(function(r) {
        console.log("SW scope:", r.scope);
        console.log('ServiceWorker zarejestrowany.')
    }).catch(function(e) {
        console.log('Ups! Błąd przy rejestracji ServiceWorkera! ' + e)
    });
}