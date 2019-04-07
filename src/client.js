/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.4
 * 
 */

'use strict';
let socket = io.connect(`/chat`),
    notf;
const middleDiv = $(".panel--middle");


window.addEventListener("DOMContentLoaded", function() {
    const el = $(".panel--middle");
    const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
    const calc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
    el.style["max-height"] = calc + "px";

    window.addEventListener("resize", function() {
        const el = $(".panel--middle");
        const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
        const calc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
        el.style["max-height"] = calc + "px";
    });

    $(".textField").focus();
});

/*
 *  Error handling
 */
socket.on("connect_error", function() {
    const errorEl = $$(".error");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl.remove();

    const HTML = `<li class="error">
                    <div class="errorCont">
                        <i class="material-icons">error</i>Connection Error.
                    </div>
                    <div class="who noselect who--smaller">VV</div>
                </li>`;
    appendDOM(HTML, ".panel--middle");
});
socket.on("connect_failed", function() {
    const errorEl = $$(".error");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl.remove();

    const HTML = `<li class="error">
                    <div class="errorCont">
                        <i class="material-icons">error</i>Connection Error.
                    </div>
                    <div class="who noselect who--smaller">VV</div>
                </li>`;
    appendDOM(HTML, ".panel--middle");
});

socket.on("connect_timeout", function() {
    const errorEl = $$(".error");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl.remove();

    const HTML = `<li class="error">
                    <div class="errorCont">
                        <i class="material-icons">error</i>Connection timeout.
                    </div>
                    <div class="who noselect who--smaller">VV</div>
                </li>`;
    appendDOM(HTML, ".panel--middle");
});
socket.on("invalidSession", function(status) {
    if (status) {
        error("Invalid session, you will be redirected in 5s", 5000);
        setTimeout(() => {
            location.href = "/login";
        }, 5000);
    }
});

/*
 *  User join/leave/read
 */
socket.emit("userConnected", true);
socket.on("userConnected", function(data) {
    if (!data.self) {
        const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
        const HTML = `<li class="joined"><span>${escapeHtml(data.username)} ${data.status?"joined chat":"left chat"} - ${time}</span></li>`;
        // If (Cookies.get("user") != data.username) 
        appendDOM(HTML, ".panel--middle");
    }
    $("#uc").innerHTML = data.users;
});



/*
 *  Messages
 */

function appendMessage() {
    let val = $(".textField").value.trim();
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
        let replacedText = val.replace(reg, '<a href="$1" target="_blank">$1</a>');
        const code = /((?<=`{3}(\n)?)[^]+(?=`{3}))/gim;
        replacedText = replacedText.replace(code, '<span class="code">$1</span>');
        replacedText = replacedText.replace(/(\`{3}(\n)?)/gim, '');

        const HTML = `<li class="ms from__me" data-mid="${mid}">
                        <div class="time noselect">${time}</div>
                        <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                        <div class="message">${replacedText}</div>
                        <div class="who noselect" title="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                    </li>;`;
        appendDOM(HTML, ".panel--middle", true);
        const middleDiv = $(".panel--middle");
        middleDiv.scrollTop = middleDiv.scrollHeight;
        $(".textField").value = "";
        $(".textField").focus();
    }
}

function appendImage(files) {
    for (let i = 0; i < files.length; i++) {
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
                const HTML = `<li class="ms from__me" data-mid="${mid}">
                        <div class="time noselect">${time}</div>
                        <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                        <div class="message message--image"><img src="data:${file.type};base64,${arrayBuffer}"></div>
                        <div class="who noselect">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
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
    const code = /((?<=`{3}(\n)?)[^]+(?=`{3}))/gim;
    replacedText = replacedText.replace(code, '<span class="code">$1</span>');
    replacedText = replacedText.replace(/(\`{3}(\n)?)/gim, '').trim();
    const HTML = `<li class="ms ${username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${escapeHtml(mid)}">
                <div class="time noselect">${time}</div>
                <div class="message">${replacedText}</div>
                <div class="who noselect">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
            </li>;`;
    if ($$(".typing").length > 0) $(".typing").remove();
    appendDOM(HTML, ".panel--middle");
    const isUp = `<div data-mid="${mid}" class="tost noselect">
                    <div class="who">${escapeHtml(username.substring(0, 1).toUpperCase())}</div>
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
    const time = new Date().toJSON().substring(10, 19).replace('T', ' ');
    const HTML = `<li class="ms ${image.username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${image.mid}">
                    <div class="time noselect">${time}</div>
                    <div class="message message--image"><img src="data:${image.type};base64,${image.img}"></div>
                    <div class="who noselect">${escapeHtml(image.username.substring(0, 1).toUpperCase())}</div>
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
            const HTML = `<li class="ms from__me" data-mid="${mid}">
                        <div class="time noselect">${time}</div>
                        <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                        <div class="message message--image"><img src="data:${fileType};base64,${arrayBuffer}"></div>
                        <div class="who noselect">${escapeHtml(Cookies.get("user").substring(0, 1).toUpperCase())}</div>
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
}, false);

$(".panel--middle").addEventListener('click', function(e) {
    if (e.target && hasClass(e.target.parentNode, 'message--image')) {
        const data = e.target.getAttribute("src");
        const HTML = `<div class="modal__div">
                        <div class="gallery__cont">
                            <div class="modal__exit noselect"><i class="material-icons">close</i></div>
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
});

/*
 *  Clear your local chat history
 */
$(".clear_chat").addEventListener("click", function(e) {
    const messages = $$(".ms, .joined, .error");
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

$(".panel--middle").addEventListener('click', function(e) {
    if (e.target && hasClass(e.target, 'reverse') || hasClass(e.target.parentNode, 'reverse')) {
        const mid = hasClass(e.target.parentNode, 'reverse') ? e.target.parentNode.parentNode.getAttribute("data-mid") : e.target.parentNode.getAttribute("data-mid");
        socket.emit("reverseMessage", mid);
    }
});

socket.on("reverseMessage", function(mid) {
    const ms = $(`.ms[data-mid="${mid}"]`);
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
});