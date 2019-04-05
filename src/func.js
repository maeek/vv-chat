/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.3
 * 
 */

const domFromText = html => new DOMParser().parseFromString(html, 'text/html').body.childNodes;
let sound = new Audio();

window.addEvent = function(elem, type, callback) {
    var evt = function(e) {
            e = e || window.event;
            return callback.call(elem, e);
        },
        cb = function(e) { return evt(e); };
    if (elem.addEventListener) {
        elem.addEventListener(type, cb, false);
    } else if (elem.attachEvent) {
        elem.attachEvent("on" + type, cb);
    }
    return elem;
};
window.findParent = function(child, filter, root) {
    do {
        if (filter(child)) return child;
        if (root && child == root) return false;
    } while (child = child.parentNode);
    return false;
};
window.hasClass = function(elem, cls) {
    if (!('className' in elem)) return;
    return !!elem.className.match(new RegExp("\\b" + cls + "\\b"));
};

function getImageDimensions(file) {
    return new Promise(function(resolved) {
        var i = new Image()
        i.onload = function() {
            resolved({ w: i.width, h: i.height })
        };
        i.src = file
    })
}

function appendDOM(HTML, element = String, scroll = true) {
    const childNodes = domFromText(HTML);
    const middleDiv = document.querySelector(".panel--middle");
    if (document.querySelectorAll(".typing").length > 0) document.querySelector(".typing").remove();

    for (var i = 0; i < childNodes.length; i++) {
        document.querySelector(element).append(childNodes[i]);
    }

    if (middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
            middleDiv.scrollHeight,
            middleDiv.offsetHeight,
            middleDiv.clientHeight,
        ) - 250 && scroll) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }
}

function error(message, timeout = 2000) {
    const errID = "errID-" + randomString();
    const HTML = `<div data-eid="${errID}" class="tost tost--error noselect">Error: ${message}</div>`;
    if (document.querySelectorAll(".tost").length > 0) document.querySelector(".tost").remove();
    appendDOM(HTML, 'body');
    document.querySelector(".tost").classList.add("tost-enter");
    setTimeout(function() {
        document.querySelector(`.tost[data-eid="${errID}"]`).classList.remove("tost-enter");
        document.querySelector(`.tost[data-eid="${errID}"]`).classList.add("tost-leave");
        setTimeout(function() {
            document.querySelector(`.tost[data-eid="${errID}"]`).remove();
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

/*
 *  Self sent messages append
 */
function appendMessage() {
    let val = document.querySelector(".textField").value.trim();
    const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
    if (val != "" && Cookies.get("user")) {
        const mid = `ms-${randomString()}-${socket.id}`;
        socket.emit("message", {
            username: Cookies.get("user"),
            message: val,
            time: time,
            mid: mid
        });
        val = escapeHtml(val);
        const reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        const replacedText = val.replace(reg, '<a href="$1" target="_blank">$1</a>');
        const HTML = `<div class="ms from__me" data-mid="${mid}">
                        <div class="time noselect">${time}</div>
                        <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                        <div class="message">${replacedText}</div>
                        <div class="who noselect" title="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                    </div>;`;
        appendDOM(HTML, ".panel--middle", true);
        const middleDiv = document.querySelector(".panel--middle");
        middleDiv.scrollTop = middleDiv.scrollHeight;
        document.querySelector(".textField").value = "";
        document.querySelector(".textField").focus();
    }
}

function appendImage(files) {
    for (let i = 0; f = files[i]; i++) {
        const file = files[i];

        if (file.type.indexOf("image") >= 0) {
            const fileReader = new FileReader();
            fileReader.onloadend = function(e) {

                const arrayBuffer = e.target.result.replace(/^data:.+;base64,/, '');
                const mid = `ms-${randomString()}-${socket.id}`;
                socket.emit("image", {
                    username: Cookies.get("user"),
                    type: file.type,
                    name: file.name,
                    blob: arrayBuffer,
                    mid: mid
                });
                const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
                const HTML = `<div class="ms from__me" data-mid="${mid}">
                        <div class="time noselect">${time}</div>
                        <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                        <div class="message message--image"><img src="data:${file.type};base64,${arrayBuffer}"></div>
                        <div class="who noselect">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                    </div>`;
                if (document.querySelectorAll(".typing").length > 0) document.querySelector(".typing").remove();

                const panelMiddle = document.querySelector(".panel--middle");
                getImageDimensions(`data:${file.type};base64,${arrayBuffer}`).then(dims => {
                    appendDOM(HTML, ".panel--middle", false);
                    panelMiddle.scrollTop = panelMiddle.scrollTop + dims.h;
                    if (panelMiddle.scrollTop + panelMiddle.clientHeight > Math.max(
                            panelMiddle.scrollHeight,
                            panelMiddle.offsetHeight,
                            panelMiddle.clientHeight,
                        ) - 250)
                        panelMiddle.scrollTop = panelMiddle.scrollHeight + dims.h;
                    else
                        panelMiddle.scrollTop = panelMiddle.scrollTop - dims.h;
                });
                document.querySelector(".textField").focus();
            }
            fileReader.readAsDataURL(file);
        }
    }
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
    document.querySelector(".settings--popup").addEventListener("click", function() {
        const HTML = `<div class="settings__div">
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
                                <div class="branding noselect">1.0.3</div>
                                <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                            </div>
                        </div>
                    </div>`;
        appendDOM(HTML, 'body', false);
        if (localStorage.getItem("mute"))
            document.querySelector(".mute").checked = true;
        if (localStorage.getItem("disableVibration"))
            document.querySelector(".disableVibration").checked = true;
        document.querySelector(".settings__div").classList.add("anim--opacity");
        document.querySelector(".settings__cont").classList.add("anim--opacity", "anim--scale");
    });
    window.addEvent(document.querySelector("body"), "click", function(e) {
        let s = window.findParent(e.srcElement || e.target, function(elm) {
            return window.hasClass(elm, "settings__exit");
        }, this);
        if (s) {
            s.parentNode.classList.remove("anim--opacity", "anim--scale");
            s.parentNode.parentNode.classList.remove("anim--opacity");
            setTimeout(function() {
                s.parentNode.parentNode.remove();
            }, 300);
        }
    });
    window.addEvent(document.querySelector("body"), "input", function(e) {
        let s = window.findParent(e.srcElement || e.target, function(elm) {
            return window.hasClass(elm, "mute");
        }, this);
        if (s) {
            const mute = s.checked;
            if (mute)
                localStorage.setItem("mute", true);
            else
                localStorage.removeItem("mute");
        }
    });
    window.addEvent(document.querySelector("body"), "input", function(e) {
        let s = window.findParent(e.srcElement || e.target, function(elm) {
            return window.hasClass(elm, "disableVibration");
        }, this);
        if (s) {
            const vibe = s.checked;
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
    window.addEvent(document.querySelector("body"), "click", function(e) {
        let s = window.findParent(e.srcElement || e.target, function(elm) {
            return window.hasClass(elm, "change--password");
        }, this);
        if (s) {
            const oldPassDiv = s.parentNode.parentNode.querySelector("input[name='resetPasswordOld']");
            const newPassDiv = s.parentNode.querySelector("input[name='resetPassword']");
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
                        document.querySelector(".status__div").classList.remove("statusError");
                        document.querySelector(".status__div").classList.add("statusSuccess");
                        document.querySelector(".status__div").innerHTML = `Password updated`;
                        newPassDiv.value = "";
                        oldPassDiv.value = "";
                    } else {
                        document.querySelector(".status__div").classList.remove("statusSuccess");
                        document.querySelector(".status__div").classList.add("statusError");
                        document.querySelector(".status__div").innerHTML = `Failed to update password`;
                    }
                });
            } else {
                document.querySelector(".status__div").classList.remove("statusSuccess");
                document.querySelector(".status__div").classList.add("statusError");
                document.querySelector(".status__div").innerHTML = `Password to short`;
            }
        }
    });
});