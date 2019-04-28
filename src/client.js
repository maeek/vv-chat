/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.5
 * 
 */

'use strict';
let socket = io.connect(`/chat`, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10
    }),
    notf;
const middleDiv = $(".panel--middle");


window.addEventListener("DOMContentLoaded", function() {
    // if (document.width !== undefined ? document.width : document.body.offsetWidth <= 900) {
    //     $("aside").height = $("aside").height;
    //     const el = $(".page__wrapper");
    //     const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
    //     const calc = wh - $("aside").offsetHeight;
    //     el.style["max-height"] = calc + "px";
    // }
    const panel = $(".panel--middle");
    const pwh = $(".page__wrapper").offsetHeight;
    const pcalc = pwh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight - 10;
    panel.style["max-height"] = pcalc + "px";

    window.addEventListener("resize", function() {
        // const el = $(".page__wrapper");
        // const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
        // let calc;
        // if (document.width !== undefined ? document.width : document.body.offsetWidth <= 900) {
        //     calc = wh - $("aside").offsetHeight;
        // } else {
        //     calc = wh;
        // }
        // el.style["max-height"] = calc + "px";

        const panel = $(".panel--middle");
        const pwh = $(".page__wrapper").offsetHeight;
        const pcalc = pwh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight - 10;
        panel.style["max-height"] = pcalc + "px"
    });

    $(".textField").focus();
});

/*
 *  Error handling
 */
socket.on("connect_error", function() {
    const errorEl = $$(".error:not(.reconnect)");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl[i].remove();

    const HTML = `<li class="error">
                    <div class="who noselect who--smaller"><i class="material-icons">warning</i></div>
                    <div class="errorCont">Connection Error</div>
                </li>`;
    appendDOM(HTML, ".panel--middle");
    $("#uc").innerHTML = 0;
});
socket.on("connect_failed", function() {
    const errorEl = $$(".error:not(.reconnect)");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl[i].remove();

    const HTML = `<li class="error">
                    <div class="who noselect who--smaller"><i class="material-icons">warning</i></div>
                    <div class="errorCont">Connection Error</div>
                </li>`;
    appendDOM(HTML, ".panel--middle");
    $("#uc").innerHTML = 0;
});

socket.on("connect_timeout", function() {
    const errorEl = $$(".error:not(.reconnect)");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl[i].remove();

    const HTML = `<li class="error">
                    <div class="who noselect who--smaller"><i class="material-icons">warning</i></div>
                    <div class="errorCont">Connection timeout</div>
                </li>`;
    appendDOM(HTML, ".panel--middle");
    $("#uc").innerHTML = 0;
});
socket.on("reconnecting", function(at) {
    const errorEl = $$(".reconnect");
    const HTML = `<li class="error reconnect">
                    <div class="who noselect recAttemps">${at}/10</div>
                    <div class="errorCont">Reconnection attempt...</div>
                </li>`;
    if (errorEl.length > 0)
        $(".recAttemps").innerHTML = at + "/10";
    else
        appendDOM(HTML, ".panel--middle");
    $("#uc").innerHTML = 0;
});
socket.on("reconnect_failed", function() {
    const errorEl = $$(".reconnect");
    const HTML = `<li class="error reconnect">
            <div class="who noselect recAttemps"><i class="material-icons">error</i></div>
            <div class="errorCont">Reconnection failed, try refreshing the page</div>
        </li>`;
    if (errorEl.length > 0) {
        $(".recAttemps").innerHTML = "";
        appendDOM(`<i class="material-icons">error</i>`, ".recAttemps");
        $(".reconnect .errorCont").innerHTML = "Reconnecting failed, try refreshing the page";
    } else {
        appendDOM(HTML, ".panel--middle");
    }
});

socket.on("reconnect", function() {
    const errorEl = $$(".error, .reconnect");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl[i].remove();
    socket.emit("userConnected", true);
});
socket.on("invalidSession", function(status) {
    if (status) {
        socket.close();
        location.href = "/logout";
    }
});

/*
 *  User join/leave/read
 */
socket.emit("userConnected", true);
socket.on("userConnected", function(data) {
    if (!data.self) {
        const time = getTime();
        const HTML = `<li class="joined"><span>${escapeHtml(data.username)} ${data.status?"joined chat":"left chat"} - ${time}</span></li>`;
        appendDOM(HTML, ".panel--middle");
    }
    $("#uc").innerHTML = data.users;
});




/*
 *  Messages
 */

function appendMessage() {
    let val = $(".textField").value.trim();
    const time = getTime();
    if (val != "" && Cookies.get("user")) {
        if (socket.io.readyState == "open") {
            const mid = `ms-${randomString()}-${Cookies.get("clientId")}`;
            socket.emit("message", {
                username: Cookies.get("user"),
                message: val,
                time: time,
                mid: mid
            });
            val = escapeHtml(val);
            const reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            let replacedText = val.replace(reg, '<a href="$1" target="_blank">$1</a>');
            const HTML = `<li class="ms from__me" data-mid="${mid}">
                            <div class="time noselect">${time}</div>
                            <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                            <div class="message">${replacedText}</div>
                            <div class="who noselect" data-user="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                        </li>;`;
            appendDOM(HTML, ".panel--middle", true);
            const middleDiv = $(".panel--middle");
            middleDiv.scrollTop = middleDiv.scrollHeight;
            $(".textField").value = "";
            $(".textField").focus();
        } else {
            error("Failed sending message");
            $(".textField").focus();
        }
    } else if (typeof Cookies.get("user") === "undefined") {
        socket.close();
        location.href = "/logout";
    }
}

function appendImage(files) {
    if (Cookies.get("user")) {
        if (socket.io.readyState == "open") {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.type.indexOf("image") >= 0) {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function(e) {

                        const arrayBuffer = e.target.result.replace(/^data:.+;base64,/, '');
                        const mid = `ms-${randomString()}-${Cookies.get("clientId")}`;
                        socket.emit("image", {
                            username: Cookies.get("user"),
                            type: file.type,
                            name: file.name,
                            blob: arrayBuffer,
                            mid: mid
                        }, (uploaded) => {
                            if (uploaded) {
                                $(`.from__me[data-mid="${mid}"] .loader`).remove()
                            }
                        });
                        const time = getTime();
                        const HTML = `<li class="ms from__me" data-mid="${mid}">
                            <div class="time noselect">${time}</div>
                            <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                            <div class="message message--image">
                                <img data-type="${file.type}" data-name="${file.name}" src="data:${file.type};base64,${arrayBuffer}">
                                <div class="loader"></div>
                            </div>
                            <div class="who noselect" data-user="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                        </li>`;
                        if ($$(".typing").length > 0) $(".typing").remove();

                        const panelMiddle = $(".panel--middle");
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
                        $(".textField").focus();
                    }
                    fileReader.readAsDataURL(file);
                }
            }
        } else {
            error("Failed sending message");
            $(".textField").focus();
        }
    } else {
        socket.close();
        location.href = "/logout";
    }
}



let isUpTimeout;
socket.on("message", function(data) {
    let message = data.message;
    const mid = data.mid,
        time = data.time,
        username = data.username,
        reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;

    message = escapeHtml(message.trim());
    let replacedText = message.replace(reg, '<a href="$1" target="_blank">$1</a>');
    const HTML = `<li class="ms ${username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${escapeHtml(mid)}">
                <div class="time noselect">${time}</div>
                ${username==Cookies.get("user")?'<div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>':''}
                <div class="message">${replacedText}</div>
                <div class="who noselect" data-user="${escapeHtml(username)}">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
            </li>;`;
    if ($$(".typing").length > 0) $(".typing").remove();
    appendDOM(HTML, ".panel--middle");
    const isUp = `<div data-mid="${mid}" class="tost noselect">
                    <div class="who" data-user="${escapeHtml(username)}">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
                    <div class="text">${escapeHtml(message.length > 25?message.substring(0,25)+"...":message)}</div>
                </div>`;
    if (middleDiv.scrollTop + middleDiv.clientHeight + $(`.ms[data-mid='${mid}']`).offsetHeight < Math.max(
            middleDiv.scrollHeight,
            middleDiv.offsetHeight,
            middleDiv.clientHeight,
        ) - 250) {
        if ($$(".tost").length > 0) {
            $(`.tost`).setAttribute("data-mid", mid);
            $(`.tost .who`).innerHTML = escapeHtml(username.substring(0, 1).toUpperCase());
            $(`.tost .text`).innerHTML = escapeHtml(message.length > 25 ? message.substring(0, 25) + "..." : message);
        } else {
            appendDOM(isUp, 'body', false);
            $(`.tost[data-mid="${mid}"]`).classList.add("tost-enter");
        }
        clearTimeout(isUpTimeout);
        isUpTimeout = setTimeout(function() {
            $(`.tost[data-mid="${mid}"]`).classList.add("tost-leave");
            setTimeout(function() {
                $(`.tost[data-mid="${mid}"]`).remove();
            }, 300);
        }, 3000);
    } else {
        middleDiv.scrollTop = middleDiv.scrollHeight;
    }
    newNotf(username);
});



$(".send").addEventListener("click", appendMessage);
$(".textField").addEventListener("keydown", function(e) {
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
    const time = getTime();
    const HTML = `<li class="ms ${image.username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${image.mid}">
                    <div class="time noselect">${time}</div>
                    ${image.username==Cookies.get("user")?'<div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>':''}
                    <div class="message message--image"><img data-type="${image.type}" data-name="${image.name}" src="data:${image.type};base64,${image.img}"></div>
                    <div class="who noselect" data-user="${escapeHtml(image.username)}">${escapeHtml(image.username.substring(0, 1).toUpperCase())}</div>
                </li>`;
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
        if ($$(".tost").length > 0) {
            $(`.tost`).setAttribute("data-mid", image.mid);
            $(`.tost .who`).innerHTML = escapeHtml(image.username.substring(0, 1).toUpperCase());
            $(`.tost .text`).innerHTML = 'Sent photo';
        } else {
            appendDOM(isUp, 'body', false);
            $(`.tost[data-mid="${image.mid}"]`).classList.add("tost-enter");
        }
        isUpTimeout = setTimeout(function() {
            $(`.tost[data-mid="${image.mid}"]`).classList.add("tost-leave");
            setTimeout(function() {
                $(`.tost[data-mid="${image.mid}"]`).remove();
            }, 300);
        }, 4000);
    }
    newNotf(image.username, true);
});

$("input[type='file']").addEventListener('input', function(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = e.target.files;
    if (files.length < 5)
        appendImage(files);
    else
        error('Selected too many photos, limit is 4')
}, false);

$(".photo").addEventListener("click", function(e) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        $("input[type='file']").click();
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
});

$(".textField").addEventListener("paste", function(pasteEvent) {
    if (Cookies.get("user")) {
        let items = pasteEvent.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") == -1) continue;
            let blob = items[i].getAsFile();
            let fileReader = new FileReader();
            var fileType = items[i].type;
            var name = items[i].name
            var mid = `ms-${randomString()}-${Cookies.get("clientId")}`;
            fileReader.onloadend = function(e) {
                let arrayBuffer = e.target.result.replace(/^data:.+;base64,/, '');
                socket.emit("image", {
                    username: Cookies.get("user"),
                    type: fileType,
                    name: name,
                    blob: arrayBuffer,
                    mid: mid
                }, (uploaded) => {
                    if (uploaded) {
                        $(`.from__me[data-mid="${mid}"] .loader`).remove()
                    }
                });
                const time = getTime();
                const HTML = `<li class="ms from__me" data-mid="${mid}">
                    <div class="time noselect">${time}</div>
                    <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                    <div class="message message--image">
                        <img data-type="${file.type}" data-name="${file.name}" src="data:${file.type};base64,${arrayBuffer}">
                        <div class="loader"></div>
                    </div>
                    <div class="who noselect" data-user="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                </li>`;
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
    } else {
        location.href = "/logout";
    }
}, false);

$(".panel--middle").addEventListener('click', function(e) {
    if (e.target && hasClass(e.target.parentNode, 'message--image')) {
        const data = e.target.getAttribute("src");
        const type = e.target.getAttribute("data-type");
        const name = e.target.getAttribute("data-name");
        const user = e.target.parentNode.parentNode.querySelector(".who").getAttribute("data-user");
        const mid = e.target.parentNode.parentNode.getAttribute("data-mid");
        const fileSize = (data.length * (3 / 4)) - (data[data.length - 3] + data[data.length - 2] == "==" ? 2 : data[data.length - 2] == "=" ? 1 : 0);
        const HTML = `<div class="modal__div" data-mid="${mid}">
                        <div class="gallery__cont">
                            <div class="modal__exit noselect"><i class="material-icons">close</i></div>
                            <div class="gallery__download noselect" data-type="${type}" data-name="${name}"><i class="material-icons">save</i></div>
                            <div class="modal__fileinfo">${formatSizeUnits(fileSize)}</div>
                            <div class="who noselect modal__who">${user.substring(0,1).toLowerCase()}</div>
                            <div class="img__div">
                                <img class="gallery__img">
                            </div>
                        </div>
                    </div>`;
        appendDOM(HTML, 'body');
        $(".modal__div").classList.add("anim--opacity");
        $(".gallery__cont").classList.add("anim--opacity");
        $(".img__div").classList.add("anim--scale");
        $(".gallery__img").src = data;
    }
});

window.addEventListener("focus", function() {
    $(".textField").focus();
    socket.io.reconnection(true);
    socket.io._reconnectionAttempts = 10;
    socket.io.open(function() {
        if (socket.io.readyState == "open") {
            console.log(status);
            const errorEl = $$(".error, .reconnect");
            if (errorEl.length > 0) {
                for (let i = 0; i < errorEl.length; i++)
                    errorEl[i].remove();
                socket.emit("userConnected", true);
            }
        }
    });
});
window.addEventListener("blur", function() {
    socket.io._reconnectionAttempts = 0;
});

/*
 *  Clear your local chat history
 */
$(".clear_chat").addEventListener("click", function(e) {
    const messages = $$(".ms, .joined, .error, .info--change");
    revSelectedIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        const t = messages.length < 200 ? i * 3 : i * 2;
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
const dropImage = $('.panel--bottom');
dropImage.addEventListener('dragover', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
    $('.textField').setAttribute("placeholder", "Drop image here");
    $('.panel--bottom').style.background = "#454d6f";
}, false);
dropImage.addEventListener('dragleave', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $('.panel--bottom').removeAttribute("style");
    $('.textField').setAttribute("placeholder", "Type message here");

}, false);
dropImage.addEventListener('drop', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer.files;
    $('.panel--bottom').removeAttribute("style");
    $('.textField').setAttribute("placeholder", "Type message here");
    appendImage(files);
}, false);


/*
 *  Revert message that you sent
 */
let revSelectedIndex = -1;
$(".panel--middle").addEventListener('click', function(e) {
    if (e.target && hasClass(e.target, 'reverse') || hasClass(e.target.parentNode, 'reverse')) {
        const messageDiv = hasClass(e.target.parentNode, 'reverse') ? e.target.parentNode.parentNode : e.target.parentNode;
        const mid = messageDiv.getAttribute("data-mid");
        if (e.ctrlKey) {
            if (typeof messageDiv.getAttribute("data-selected") === undefined || messageDiv.getAttribute("data-selected") == null) {
                messageDiv.style.background = "rgba(43, 52, 84, 0.5)";
                messageDiv.setAttribute("data-selected", mid);
                const nodes = Array.prototype.slice.call($$(".from__me")),
                    liRef = messageDiv;
                revSelectedIndex = nodes.indexOf(liRef);
            } else {
                messageDiv.removeAttribute("style");
                messageDiv.removeAttribute("data-selected");
                if ($$(".from__me[data-selected]").length === 0) revSelectedIndex = -1;
            }
        } else if (e.shiftKey && revSelectedIndex != -1) {
            messageDiv.setAttribute("data-selected", mid);
            const nodes = Array.prototype.slice.call($$(".from__me")),
                liRef = messageDiv;
            const index = nodes.indexOf(liRef);
            if (index > revSelectedIndex) {
                for (let i = revSelectedIndex; i <= index; i++) {
                    $$(".from__me")[i].style.background = "rgba(43, 52, 84, 0.5)";
                    $$(".from__me")[i].setAttribute("data-selected", $$(".from__me")[i].getAttribute("data-mid"));
                }
            } else {
                for (let i = revSelectedIndex; i >= index; i--) {
                    $$(".from__me")[i].style.background = "rgba(43, 52, 84, 0.5)";
                    $$(".from__me")[i].setAttribute("data-selected", $$(".from__me")[i].getAttribute("data-mid"));
                }
            }
        } else {
            if ($$(".from__me[data-selected]").length > 0) {
                messageDiv.setAttribute("data-selected", mid);
                for (let i = 0; i < $$(".from__me[data-selected]").length; i++)
                    socket.emit("reverseMessage", $$(".from__me[data-selected]")[i].getAttribute("data-selected"));
            } else {
                socket.emit("reverseMessage", mid);
            }
            revSelectedIndex = -1;
        }
    }
});

socket.on("reverseMessage", function(mid) {
    const ms = $$(`[data-mid="${mid}"]`);
    for (let i = 0; i < ms.length; i++) {
        if (typeof ms[i] !== undefined && ms[i] != null) {
            if (!hasClass(ms[i], 'modal__div')) {
                ms[i].classList.add("transition-leave");
            } else {
                $(".gallery__cont").classList.remove("anim--opacity");
                $(".img__div").classList.remove("anim--scale");
                $(".modal__div").classList.remove("anim--opacity");
            }
            setTimeout(function() {
                ms[i].remove();
            }, 200)
        }
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
            if ($$(".typing").length > 0) $(".typing").remove();
            const HTML = `<li class="typing">
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
            </li>`;
    appendDOM(HTML, ".panel--middle", false);
    clearTimeout(timeout);
    timeout = setTimeout(function() {
        const el = $$(".who-typer");
        for (let i = 0; i < el.length; i++) {
            const user = el[i].getAttribute("data-user");
            userTyping.splice(userTyping.indexOf(user), 1);
        }
        if ($$(".typing").length > 0) $(".typing").remove();
    }, 1500);
});


/* Sessions */

socket.on("activeSessions", (data) => {
    const sessions = $$("li[data-socketid]");
    for (let i = 0; i < sessions.length; i++)
        sessions[i].remove();
    if ($$('.activeSessions').length > 0) {
        for (let i = 0; i < data.length; i++) {
            appendDOM(
                `<li data-socketid="${data[i].socketId}">
                        <span class="session--id">${(typeof socket !== undefined && data[i].socketId == socket.id)?"This device":data[i].os}</span>
                        <span class="session--time">${data[i].lastAccess}</span>
                        <span class="remove--session__span remove--session"><i class="material-icons">close</i></span>
                    </li>`,
                '.activeSessions'
            );
        }
    }
});
if ($$(".settings--popup").length > 0) {
    $(".settings--popup").addEventListener("click", function() {
        socket.emit("activeSessions", true, function(data) {
            const sessions = $$(".session__li");
            for (let i = 0; i < sessions.length; i++)
                sessions[i].remove();
            appendDOM(`<li class="noselect">
                            <span>Device</span>
                            <span class="session--time">First seen</span>
                            <span class="remove--session__span"><i class="material-icons">close</i></span>
                        </li>`, '.activeSessions');
            for (let i = 0; i < data.length; i++) {
                appendDOM(
                    `<li class="session__li" data-socketid="${data[i].socketId}">
                        <span class="session--id">${(typeof socket !== undefined && data[i].socketId == socket.id)?"This device":data[i].os}</span>
                        <span class="session--time">${data[i].lastAccess}</span>
                        <span class="remove--session__span remove--session"><i class="material-icons">close</i></span>
                    </li>`,
                    '.activeSessions'
                );
            }
        });
    });
}
document.addEventListener('click', function(e) {
    if (e.target && hasClass(e.target, 'tost') || hasClass(e.target.parentNode, 'tost')) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
        if (hasClass(e.target, 'tost')) e.target.classList.add("tost-leave");
        else e.target.parentNode.classList.add("tost-leave");
        setTimeout(function() {
            if (hasClass(e.target, 'tost')) e.target.remove();
            else e.target.parentNode.remove();
        }, 300);
    }
    else if (e.target && hasClass(e.target, 'modal__exit') || hasClass(e.target.parentNode, 'modal__exit')) {
        $(".gallery__cont").classList.remove("anim--opacity");
        $(".img__div").classList.remove("anim--scale");
        $(".modal__div").classList.remove("anim--opacity");
        setTimeout(function() {
            $(".modal__div").remove();
        }, 300);
    }
    else if (e.target && hasClass(e.target, 'gallery__download') || hasClass(e.target.parentNode, 'gallery__download')) {
        const btn = hasClass(e.target, 'gallery__download')?e.target:e.target.parentNode;
        const type = btn.getAttribute("data-type");
        const name = btn.getAttribute("data-name");
        const image = btn.parentNode.querySelector(".gallery__img").src;
        fetch(image)
        .then(res => res.blob())
        .then(blob => {
            const anchor = document.createElement('a');
            anchor.download = name;
            anchor.href = window.URL.createObjectURL(blob);
            anchor.dataset.downloadurl = [type+';charset=utf8', anchor.download, anchor.href].join(':');
            anchor.click();
        })
       
    } else if (e.target && hasClass(e.target, 'remove--session') || hasClass(e.target.parentNode, 'remove--session')) {
        const btn = hasClass(e.target.parentNode, 'remove--session') ? e.target.parentNode : e.target;
        const socketId = btn.parentNode.getAttribute("data-socketid");
        socket.emit("removeSession", socketId, (data) => {
            const sessions = $$(".session__li");
            for (let i = 0; i < sessions.length; i++)
                sessions[i].remove();
            for (let i = 0; i < data.length; i++) {
                appendDOM(
                    `<li class="session__li" data-socketid="${data[i].socketId}">
                            <span class="session--id">${(typeof socket !== undefined && data[i].socketId == socket.id)?"This device":data[i].os}</span>
                            <span class="session--time">${data[i].lastAccess}</span>
                            <span class="remove--session__span remove--session"><i class="material-icons">close</i></span>
                        </li>`,
                    '.activeSessions'
                );
            }
        });
    } else if (e.target && hasClass(e.target, 'room--change') || hasClass(e.target.parentNode, 'room--change')) {
        const btn = hasClass(e.target.parentNode, 'room--change') ? e.target.parentNode : e.target;
        const name = btn.getAttribute("data-name");
        location.hash = `${encodeURIComponent(name)}`;
    } else if (e.target && hasClass(e.target, 'room--show') || hasClass(e.target.parentNode, 'room--show')) {
        const btn = hasClass(e.target.parentNode, 'room--show') ? e.target.parentNode : e.target;
        const HTML = `<div class="modal__div">
                            <div class="settings__cont rooms__cont">
                                <div class="settings__exit noselect"><i class="material-icons">close</i></div>
                                <div class="title noselect">Rooms</div>
                                <p class="description noselect">Change chat room.</p>
                                <div class="subtitle noselect">Available rooms</div>
                                <ul class="rooms noselect">
                                    <li class="room--change" data-icon="🐫" data-name="Main"><i>🐫</i> Main</li>
                                    <li class="room--change" data-icon="🙊" data-name="tajne/poufne"><i>🙊</i> tajne/poufne</li>
                                    <li class="room--change" data-icon="🐘" data-name="granie"><i>🐘</i> granie</li>
                                    <li class="room--change" data-icon="🐑" data-name="Bardzo długie zdanie jakie wymyślam na bieżąco, nie rób nic nikomu, nigdy, choćby nie wiem co"><i>🐑</i> Bardzo długie zdanie jakie wymyślam na bieżąco, nie rób nic nikomu, nigdy, choćby nie wiem co</li>
                                    <li class="room--change" data-icon="🦁" data-name="ło panie"><i>🦁</i> ło panie</li>
                                    <li class="room--change" data-icon="🐗" data-name="boar"><i>🐗</i> boar</li>
                                    <li class="room--change" data-icon="🍄" data-name="yEE"><i>🍄</i> yEE</li>
                                    <li class="room--change" data-icon="🌴" data-name="bob"><i>🌴</i> bob</li>
                                    <li class="room--change" data-icon="🐙" data-name="pomidor"><i>🐙</i> pomidor</li>
                                    <li class="room--change" data-icon="🐸" data-name="żabson ziomal"><i>🐸</i> żabson ziomal</li>
                                    <li class="room--change" data-icon="🐤" data-name="pip"><i>🐤</i> pip</li>
                                    <li class="room--change" data-icon="🐔" data-name="broilerek"><i>🐔</i> broilerek</li>
                                    <li class="room--change" data-icon="🐼" data-name="pandoo"><i>🐼</i> pandoo</li>
                                    <li class="room--change" data-icon="🐀" data-name="rastafarianie"><i>🐀</i> rastafarianie</li>
                                    <li class="room--change" data-icon="🐷" data-name="kwiiii"><i>🐷</i> kwiiii</li>
                                    <li class="room--change" data-icon="🐴" data-name="koniarze"><i>🐴</i> koniarze</li>
                                </ul>
                                <div class="footer">
                                    <div class="branding noselect">1.0.5</div>
                                    <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                                </div>
                            </div>
                        </div>`;
            appendDOM(HTML, 'body', false);
            let hash = location.hash;
            let name = decodeURIComponent(hash.substring(1));
            socket.emit("listRooms", true, (list)=> {
                const selRooms = $$(`.room--change[data-name="${name}"]`);
                for(let i = 0; i< selRooms.length; i++) {
                    selRooms[i].classList.add("room--active");
                }
            });
            $(".modal__div").classList.add("anim--opacity");
            $(".settings__cont").classList.add("anim--opacity", "anim--scale");

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
                                    <div class="branding noselect">1.0.5</div>
                                    <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                                </div>
                            </div>
                        </div>`;
            appendDOM(HTML, 'body', false);
            fetch("/js/emoji.json", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(res => res.json()).then(emojis => {
                $(".room__icons").innerHTML="";
                for(let i = 0; i< emojis.list.length;i++){
                    let uni = emojis.list[i].indexOf("-") != -1?emojis.list[i].split("-"):[emojis.list[i]];
                    let uniCode="";
                    for(let j = 0; j< uni.length;j++){
                        uniCode += String.fromCodePoint(parseInt(uni[j], 16));
                    }
                    appendDOM(`<i class="select__icon" data-index="${i}">${uniCode}</i>`, '.room__icons');
                }
            }).catch(e => console.log(e));
            $(".modal__div").classList.add("anim--opacity");
            $(".settings__cont").classList.add("anim--opacity", "anim--scale");
    }else if (e.target && hasClass(e.target, 'select__icon')) {
        const icons = $$(".select__icon");
        for(let i = 0; i< icons.length;i++)
            icons[i].classList.remove("icon--active");
        e.target.classList.add("icon--active");
        $(".icon--prev").innerHTML = e.target.innerHTML;
    }
});
if(location.hash){
    let hash = location.hash;
    let name = decodeURIComponent(hash.substring(1));
    const rooms = $$(".room--change");
    for(let i = 0; i< rooms.length; i++) {
        rooms[i].classList.remove("room--active");
    }
    const selRooms = $$(`.room--change[data-name="${name}"]`);
    for(let i = 0; i< selRooms.length; i++) {
        selRooms[i].classList.add("room--active");
    }        
    $(".rooms--title").innerHTML = "";        
    socket.emit("changeRoom", name, function(roomInfo) {
        appendDOM(`<i>${roomInfo.icon}</i> <span>${roomInfo.name}</span>`, '.rooms--title');
        appendDOM(
            `<li class="info--change">
                <div class="noselect info--room"><i>${roomInfo.icon}</i></div>
                <div class="info--changeCont">Joined "${roomInfo.name}"</div>
            </li>`, 
            '.panel--middle'
        );
    });
}
window.addEventListener("hashchange",function(){
    let hash = location.hash;
    let name = decodeURIComponent(hash.substring(1));
    const rooms = $$(".room--change");
    for(let i = 0; i< rooms.length; i++) {
        rooms[i].classList.remove("room--active");
    }
    const selRooms = $$(`.room--change[data-name="${name}"]`);
    for(let i = 0; i< selRooms.length; i++) {
        selRooms[i].classList.add("room--active");
    }        
    $(".rooms--title").innerHTML = "";        
    socket.emit("changeRoom", name, function(roomInfo) {
        appendDOM(`<i>${icon}</i> <span>${name}</span>`, '.rooms--title');
        appendDOM(
            `<li class="info--change">
                <div class="noselect info--room"><i>${icon}</i></div>
                <div class="info--changeCont">Joined "${name}"</div>
            </li>`, 
            '.panel--middle'
        );
    });
},false);