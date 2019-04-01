/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.1
 * 
 */
// import { test } from './js/func.js';
// console.log(test);

'use strict';
let socket = io.connect(`/chat`),
    notf;
const middleDiv = document.querySelector(".panel--middle");


window.addEventListener("DOMContentLoaded", function() {
    const el = document.querySelector(".panel--middle");
    const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
    const calc = wh - document.querySelector(".panel--top").offsetHeight - document.querySelector(".panel--bottom").offsetHeight;
    el.style["max-height"] = calc + "px";

    window.addEventListener("resize", function() {
        const el = document.querySelector(".panel--middle");
        const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
        const calc = wh - document.querySelector(".panel--top").offsetHeight - document.querySelector(".panel--bottom").offsetHeight;
        el.style["max-height"] = calc + "px";
    });

    document.querySelector(".textField").focus();
});

/*
 *  Error handling
 */
socket.on("connect_error", function() {
    const errorEl = document.querySelectorAll(".error");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl.remove();

    const HTML = `<div class="error">
                    <div class="errorCont">
                        <i class="material-icons">error</i>Connection Error.
                    </div>
                    <div class="who noselect who--smaller">VV</div>
                </div>`;
    appendDOM(HTML, ".panel--middle");
});
socket.on("connect_failed", function() {
    const errorEl = document.querySelectorAll(".error");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl.remove();

    const HTML = `<div class="error">
                    <div class="errorCont">
                        <i class="material-icons">error</i>Connection Error.
                    </div>
                    <div class="who noselect who--smaller">VV</div>
                </div>`;
    appendDOM(HTML, ".panel--middle");
});

socket.on("connect_timeout", function() {
    const errorEl = document.querySelectorAll(".error");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl.remove();

    const HTML = `<div class="error">
                    <div class="errorCont">
                        <i class="material-icons">error</i>Connection timeout.
                    </div>
                    <div class="who noselect who--smaller">VV</div>
                </div>`;
    appendDOM(HTML, ".panel--middle");
});


/*
 *  User join/leave/read
 */
socket.emit("userConnected", true);
socket.on("userConnected", function(data) {
    if (!data.self) {
        const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
        const HTML = `<div class="joined"><span>${escapeHtml(data.username)} ${data.status?"joined chat":"left chat"} - ${time}</span></div>`;
        // If (Cookies.get("user") != data.username) 
        appendDOM(HTML, ".panel--middle");
    }
    document.querySelector("#uc").innerHTML = data.users;
});



/*
 *  Messages
 */
let isUpTimeout;
socket.on("message", function(data) {
    let message = data.message;
    const mid = data.mid,
        time = data.time,
        username = data.username,
        reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;

    message = escapeHtml(message.trim());
    const replacedText = message.replace(reg, '<a href="$1" target="_blank">$1</a>');
    const HTML = `<div class="ms ${username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${escapeHtml(mid)}">
                <div class="time noselect">${time}</div>
                <div class="message">${replacedText}</div>
                <div class="who noselect">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
            </div>;`;
    if (document.querySelectorAll(".typing").length > 0) document.querySelector(".typing").remove();
    appendDOM(HTML, ".panel--middle");
    const isUp = `<div data-mid="${mid}" class="tost noselect">
                    <div class="who">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
                    <div class="text">${escapeHtml(message.length > 25?message.substring(0,25)+"...":message)}</div>
                </div>`;
    if (middleDiv.scrollTop + middleDiv.clientHeight < Math.max(
            middleDiv.scrollHeight,
            middleDiv.offsetHeight,
            middleDiv.clientHeight,
        ) - 250) {
        if (document.querySelectorAll(".tost").length > 0) {
            document.querySelector(`.tost`).setAttribute("data-mid", mid);
            document.querySelector(`.tost .who`).innerHTML = escapeHtml(username.substring(0, 1).toUpperCase());
            document.querySelector(`.tost .text`).innerHTML = escapeHtml(message.length > 25 ? message.substring(0, 25) + "..." : message);
        } else {
            appendDOM(isUp, 'body', false);
            document.querySelector(`.tost[data-mid="${mid}"]`).classList.add("tost-enter");
        }
        clearTimeout(isUpTimeout);
        isUpTimeout = setTimeout(function() {
            document.querySelector(`.tost[data-mid="${mid}"]`).classList.add("tost-leave");
            setTimeout(function() {
                document.querySelector(`.tost[data-mid="${mid}"]`).remove();
            }, 300);
        }, 3000);
    }
    newNotf(username);
});

window.addEvent(document.querySelector("body"), "click", function(e) {
    let s = window.findParent(e.srcElement || e.target, function(elm) {
        return window.hasClass(elm, "tost");
    }, this);
    if (s) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
        s.classList.add("tost-leave");
        setTimeout(function() {
            s.remove();
        }, 300);
    }
});

document.querySelector(".send").addEventListener("click", appendMessage);
document.querySelector(".textField").addEventListener("keydown", function(e) {
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
        13 // Disabling fake input keys (alt, shift, etc.)
    ];
    if (codes.indexOf(e.keyCode) == -1) {
        socket.emit("typing", {
            user: Cookies.get("user")
        });
    }
    if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
        appendMessage();
    }
});


/*
 *  Images
 */
socket.on("image", function(image) {
    const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
    const HTML = `<div class="ms ${image.username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${image.mid}">
                    <div class="time noselect">${time}</div>
                    <div class="message message--image"><img src="data:${image.type};base64,${image.img}"></div>
                    <div class="who noselect">${escapeHtml(image.username.substring(0, 1).toUpperCase())}</div>
                </div>`;
    getImageDimensions(`data:${image.type};base64,${image.img}`).then(dims => {
        appendDOM(HTML, ".panel--middle", false);
        middleDiv.scrollTop += dims.h;
        if (middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
                middleDiv.scrollHeight,
                middleDiv.offsetHeight,
                middleDiv.clientHeight,
            ) - 250)
            middleDiv.scrollTop = middleDiv.scrollHeight + dims.h;
        else
            middleDiv.scrollTop -= dims.h;
    });
    const isUp = `<div data-mid="${image.mid}" class="tost noselect">
                    <div class="who">${escapeHtml(image.username.substring(0, 1).toUpperCase())}</div>
                    <div class="text">Sent photo</div>
                </div>`;
    if (middleDiv.scrollTop + middleDiv.clientHeight < Math.max(
            middleDiv.scrollHeight,
            middleDiv.offsetHeight,
            middleDiv.clientHeight,
        ) - 250) {
        if (document.querySelectorAll(".tost").length > 0) {
            document.querySelector(`.tost`).setAttribute("data-mid", image.mid);
            document.querySelector(`.tost .who`).innerHTML = escapeHtml(image.username.substring(0, 1).toUpperCase());
            document.querySelector(`.tost .text`).innerHTML = 'Sent photo';
        } else {
            appendDOM(isUp, 'body', false);
            document.querySelector(`.tost[data-mid="${image.mid}"]`).classList.add("tost-enter");
        }
        isUpTimeout = setTimeout(function() {
            document.querySelector(`.tost[data-mid="${image.mid}"]`).classList.add("tost-leave");
            setTimeout(function() {
                document.querySelector(`.tost[data-mid="${image.mid}"]`).remove();
            }, 300);
        }, 4000);
    }
    newNotf(image.username, true);
});

document.querySelector("input[type='file']").addEventListener('input', function(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = e.target.files;
    appendImage(files);
}, false);

document.querySelector(".photo").addEventListener("click", function(e) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        document.querySelector("input[type='file']").click();
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
});

document.querySelector(".textField").addEventListener("paste", function(pasteEvent) {
    let items = pasteEvent.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") == -1) continue;
        let blob = items[i].getAsFile();
        let fileReader = new FileReader();
        var fileType = items[i].type;
        var name = items[i].name
        var mid = `ms-${randomString()}-${socket.id}`;
        fileReader.onloadend = function(e) {
            let arrayBuffer = e.target.result.replace(/^data:.+;base64,/, '');
            socket.emit("image", {
                username: Cookies.get("user"),
                type: fileType,
                name: name,
                blob: arrayBuffer,
                mid: mid
            });
            const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
            const HTML = `<div class="ms from__me" data-mid="${mid}">
                        <div class="time noselect">${time}</div>
                        <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                        <div class="message message--image"><img src="data:${fileType};base64,${arrayBuffer}"></div>
                        <div class="who noselect">${escapeHtml(Cookies.get("user").substring(0, 1).toUpperCase())}</div>
                    </div>`;
            getImageDimensions(`data:${fileType};base64,${arrayBuffer}`).then(dims => {
                appendDOM(HTML, ".panel--middle", false);
                middleDiv.scrollTop += dims.h;
                if (middleDiv.scrollTop + middleDiv.clientHeight > Math.max(
                        middleDiv.scrollHeight,
                        middleDiv.offsetHeight,
                        middleDiv.clientHeight,
                    ) - 250)
                    middleDiv.scrollTop = middleDiv.scrollHeight + dims.h;
                else
                    middleDiv.scrollTop -= dims.h;
            });
        }
        fileReader.readAsDataURL(blob);
    }
}, false);

window.addEvent(document.body, "click", function(e) {
    let s = window.findParent(e.srcElement || e.target, function(elm) {
        return window.hasClass(elm, "message--image");
    }, this);
    if (s) {
        const data = s.querySelector("img").getAttribute("src");
        let w = window.open('about:blank');

        setTimeout(function() {
            w.document.body.appendChild(w.document.createElement('img'))
                .src = data;
            w.document.body.style.cssText = "height:100%;width:100%;border:0;background:#000;display:flex;justify-content:center;align-items:center;margin:0;";
            getImageDimensions(data).then(dims => {
                w.document.body.querySelector("img").style.cssText = `height:${dims.h}px;width:${dims.w}px;max-width:100%;`;
            })

        }, 0);
    }
});

window.addEventListener("focus", function() {
    document.querySelector(".textField").focus();
});

/*
 *  Clear your local chat history
 */
document.querySelector(".clear_chat").addEventListener("click", function(e) {
    const messages = document.querySelectorAll(".ms, .joined, .error");
    for (let i = messages.length - 1; i >= 0; i--) {
        const t = messages.length < 200 ? i * 15 : i * 2;
        setTimeout(function() {
            messages[i].classList.add("transition-leave");
            setTimeout(function() {
                messages[i].remove();
            }, 200)
        }, t);
    }
});

/*
 *  Send image by dropping file on dropImage element
 */
const dropImage = document.querySelector('.panel--bottom');
dropImage.addEventListener('dragover', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
    document.querySelector('.textField').setAttribute("placeholder", "Drop image here");
    document.querySelector('.panel--bottom').style.background = "#454d6f";
}, false);
dropImage.addEventListener('dragleave', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    document.querySelector('.panel--bottom').removeAttribute("style");
    document.querySelector('.textField').setAttribute("placeholder", "Type message here");

}, false);
dropImage.addEventListener('drop', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer.files;
    document.querySelector('.panel--bottom').removeAttribute("style");
    document.querySelector('.textField').setAttribute("placeholder", "Type message here");
    appendImage(files);
}, false);


/*
 *  Revert message that you sent
 */
window.addEvent(document.querySelector(".panel--middle"), "click", function(e) {
    let s = window.findParent(e.srcElement || e.target, function(elm) {
        return window.hasClass(elm, "reverse");
    }, this);
    if (s) {
        const mid = s.parentNode.getAttribute("data-mid");
        socket.emit("reverseMessage", mid);
    }
});
socket.on("reverseMessage", function(mid) {
    const ms = document.querySelector(`.ms[data-mid="${mid}"]`);
    if (typeof ms !== undefined && ms != null) {
        ms.classList.add("transition-leave");
        setTimeout(function() {
            ms.remove();
        }, 200)
    }
});


/*
 *  User typing notification
 */
let userTyping = [];
let timeout;
socket.on("typing", function(mid) {
            const midPos = userTyping.indexOf(mid.user);
            if (midPos == -1) {
                userTyping.push(mid.user);
            }
            if (document.querySelectorAll(".typing").length > 0) document.querySelector(".typing").remove();
            const HTML = `<div class="typing">
                     <div class="usersTyping">
                        ${
                            (function() {
                                let uTyping = ``;
                                for (let i = 0; i<userTyping.length; i++) {
                                    uTyping += `<div class="who who-typer" data-user="${escapeHtml(userTyping[i])}" title="${escapeHtml(userTyping[i])}">${escapeHtml(userTyping[i].substring(0, 1).toUpperCase())}</div>`;
                                }
                                return uTyping;
                            })()
                        } 
                    <span>typing</span>
                </div>
            </div>`;
    appendDOM(HTML, ".panel--middle", false);
    clearTimeout(timeout);
    timeout = setTimeout(function() {
        const el = document.querySelectorAll(".who-typer");
        for (let i = 0; i < el.length; i++) {
            const user = el[i].getAttribute("data-user");
            userTyping.splice(userTyping.indexOf(user), 1);
        }
        if (document.querySelectorAll(".typing").length > 0) document.querySelector(".typing").remove();
    }, 1500);
});