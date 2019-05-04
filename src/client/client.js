/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */

'use strict';


/*****************************************************************
 * 
 * Initiating socket.io connection
 * 
 *****************************************************************/

let socket = io.connect(`/chat`, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10
    }),
    notf;
const middleDiv = $(".panel--middle");

/*****************************************************************
 * 
 * Resize elements
 * 
 *****************************************************************/

window.addEventListener("DOMContentLoaded", function DOMLoaded() {
    const el = $("aside .info");
    const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
    const panel = $(".panel--middle");

    if (document.width !== undefined ? document.width : document.body.offsetWidth > 900) {
        const calc = wh - $("aside .logo__div").offsetHeight - $("aside .side--actions").offsetHeight;
        el.style["max-height"] = calc + "px";

        const pcalc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
        panel.style["max-height"] = pcalc + "px";
    } else {
        const pcalc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight - $("aside").offsetHeight;
        panel.style["max-height"] = pcalc + "px";
    }


    window.addEventListener("resize", function win_resized() {
        const wh = document.height !== undefined ? document.height : document.body.offsetHeight;
        if (document.width !== undefined ? document.width : document.body.offsetWidth > 900) {
            const calc = wh - $("aside .logo__div").offsetHeight - $("aside .side--actions").offsetHeight;
            el.style["max-height"] = calc + "px";

            const pcalc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
            panel.style["max-height"] = pcalc + "px";
        } else {
            const pcalc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight - $("aside").offsetHeight;
            panel.style["max-height"] = pcalc + "px";
        }
        $("aside").removeAttribute("style");
        $("aside").removeAttribute("data-hidden");
    });

    $(".textField").focus();
});

/*****************************************************************
 * 
 * Socket error Handeling
 * 
 *****************************************************************/


/* 
 * Connection errors
 */
socket.on("connect_error", function socket_connect_error() {
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
socket.on("connect_failed", function socket_connect_failed() {
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

socket.on("connect_timeout", function socket_connect_timeout() {
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

/* 
 * Reconnection errors
 */
socket.on("reconnecting", function socket_reconnecting(at) {
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
socket.on("reconnect_failed", function socket_reconnect_failed() {
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

socket.on("reconnect", function socket_reconnect() {
    const errorEl = $$(".error, .reconnect");
    if (errorEl.length > 0)
        for (let i = 0; i < errorEl.length; i++)
            errorEl[i].remove();
    socket.emit("userConnected", location.hash ? decodeURIComponent(location.hash.substring(2)) : null);
});

/* 
 * Invalid session logout
 */
socket.on("invalidSession", function socket_invalidSession(status) {
    if (status) {
        socket.close();
        location.href = "/logout";
    }
});





/*****************************************************************
 * 
 * Send/receive messages
 * 
 *****************************************************************/

function appendMessage(socket) {
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
                        </li>;`;
            appendDOM(HTML, ".panel--middle", true);
            const middleDiv = $(".panel--middle");
            middleDiv.scrollTop = middleDiv.scrollHeight;
            $(`.ms[data-mid="${mid}"]`).classList.add("transition-X");
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

let isUpTimeout;
socket.on("message", function socket_message(data) {
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
                ${username==Cookies.get("user")?'':'<div class="who noselect" data-user="'+escapeHtml(username)+'">'+escapeHtml(username.substring(0, 1).toUpperCase())+'</div>'}
            </li>;`;
    if ($$(".typing").length > 0) $(".typing").remove();
    appendDOM(HTML, ".panel--middle");
    $(`.ms[data-mid="${mid}"]`).classList.add("transition-X");
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



$(".send").addEventListener("click", function send_click() { appendMessage(socket) });
$(".textField").addEventListener("keydown", function send_textField(e) {
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
        appendMessage(socket);
    }
});

/*
 * Send Emojis
 */
document.addEventListener('click', function send_emojis(e) {
    if (e.target && hasClass(e.target, 'select__emoji')) {
        let uni = e.target.getAttribute("data-index");
        uni = uni.indexOf("-") != -1 ? uni.split("-") : [uni];
        let uniCode = "";
        for (let j = 0; j < uni.length; j++) {
            uniCode += String.fromCodePoint(parseInt(uni[j], 16));
        }
        $(".textField").value += uniCode + "\u{2063}";
    } else if (e.target && hasClass(e.target, 'emojis')) {
        if ($(".sendEmoji").style["display"] == "none") {
            if ($$(".select__emoji").length < 1) {
                fetch("/js/emoji.json", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(res => res.json()).then(emojis => {
                    $(".emojiList").innerHTML = "";
                    for (let i = 0; i < emojis.list.length; i++) {
                        let uni = emojis.list[i].indexOf("-") != -1 ? emojis.list[i].split("-") : [emojis.list[i]];
                        let uniCode = "";
                        for (let j = 0; j < uni.length; j++) {
                            uniCode += String.fromCodePoint(parseInt(uni[j], 16));
                        }
                        appendDOM(`<i class="select__emoji" data-index="${emojis.list[i]}">${uniCode}</i>`, '.emojiList');
                    }
                }).catch(() => {
                    $(".emojiList").innerHTML = "";
                    appendDOM(`<i class="material-icons noselect failed-to-fetch">warning</i>`, ".emojiList");
                });
            }
            $(".sendEmoji").style["display"] = "flex";
        } else {
            $(".sendEmoji").style["display"] = "none";
        }
    } else if (e.target && !$(".sendEmoji").contains(e.target)) {
        $(".sendEmoji").style["display"] = "none";
    }
});

/*****************************************************************
 * 
 * Send/receive Images
 * 
 *****************************************************************/

function appendImage(socket, files) {
    if (Cookies.get("user")) {
        if (socket.io.readyState == "open") {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.type.indexOf("image") >= 0) {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function(e) {

                        const arrayBuffer = e.target.result.replace(/^data:.+;base64,/, '');
                        const mid = `ms-${randomString()}-${Cookies.get("clientId")}`;
                        const time = getTime();
                        const HTML = `<li class="ms from__me" data-mid="${mid}">
                            <div class="time noselect">${time}</div>
                            <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                            <div class="message message--image">
                                <img data-type="${file.type}" data-name="${file.name}" src="data:${file.type};base64,${arrayBuffer}">
                                <div class="loader"></div>
                            </div>
                            <div class="who noselect nodisplay" data-user="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0, 1).toUpperCase())}</div>
                        </li>`;
                        if ($$(".typing").length > 0) $(".typing").remove();

                        const panelMiddle = $(".panel--middle");
                        getImageDimensions(`data:${file.type};base64,${arrayBuffer}`).then(dims => {
                            appendDOM(HTML, ".panel--middle", false);
                            $(`.ms[data-mid="${mid}"]`).classList.add("transition-X");

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

socket.on("image", function socket_image(image) {
    const time = getTime();
    const HTML = `<li class="ms ${image.username==Cookies.get("user")?"from__me":"to__me"}" data-mid="${image.mid}">
                    <div class="time noselect">${time}</div>
                    ${image.username==Cookies.get("user")?'<div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>':''}
                    <div class="message message--image"><img data-type="${image.type}" data-name="${image.name}" src="data:${image.type};base64,${image.img}"></div>
                    <div class="who noselect ${image.username==Cookies.get("user")?'nodisplay':''}" data-user="${escapeHtml(image.username)}">${escapeHtml(image.username.substring(0, 1).toUpperCase())}</div>
                </li>`;
    getImageDimensions(`data:${image.type};base64,${image.img}`).then(dims => {
        appendDOM(HTML, ".panel--middle", false);
        $(`.ms[data-mid="${image.mid}"]`).classList.add("transition-X");
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

$("input[type='file']").addEventListener('input', function send_file_input(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = e.target.files;
    if (files.length < 5)
        appendImage(socket, files);
    else
        error('Selected too many photos, limit is 4')
}, false);

$(".photo").addEventListener("click", function send_file_click(e) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        $("input[type='file']").click();
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
});

$(".textField").addEventListener("paste", function send_file_paste(pasteEvent) {
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
                const time = getTime();
                const HTML = `<li class="ms from__me" data-mid="${mid}">
                    <div class="time noselect">${time}</div>
                    <div class="reverse noselect" title="Undo"><i class="material-icons">undo</i></div>
                    <div class="message message--image">
                        <img data-type="${fileType}" data-name="${name}" src="data:${fileType};base64,${arrayBuffer}">
                        <div class="loader"></div>
                    </div>
                    <div class="who noselect nodisplay" data-user="${escapeHtml(Cookies.get("user"))}">${escapeHtml(Cookies.get("user").substring(0,1).toUpperCase())}</div>
                </li>`;
                getImageDimensions(`data:${fileType};base64,${arrayBuffer}`).then(dims => {
                    appendDOM(HTML, ".panel--middle", false);
                    $(`.ms[data-mid="${mid}"]`).classList.add("transition-X");
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

/*****************************************************************
 * 
 * Show image popup
 * 
 *****************************************************************/

$(".panel--middle").addEventListener('click', function show_image_popup(e) {
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

/*****************************************************************
 * 
 * Disable sending fake reconnect signals on blur
 * 
 *****************************************************************/

window.addEventListener("focus", function win_focus() {
    $(".textField").focus();
    socket.io.reconnection(true);
    socket.io._reconnectionAttempts = 10;
    socket.io.open(function() {
        if (socket.io.readyState == "open") {
            const errorEl = $$(".error, .reconnect");
            if (errorEl.length > 0) {
                for (let i = 0; i < errorEl.length; i++)
                    errorEl[i].remove();
                socket.emit("userConnected", location.hash ? decodeURIComponent(location.hash.substring(2)) : null);
            }
        }
    });
});
window.addEventListener("blur", function win_blur() {
    socket.io._reconnectionAttempts = 0;
});


/*****************************************************************
 * 
 * Clear your local chat history
 * 
 *****************************************************************/

$(".clear_chat").addEventListener("click", function clear_chat(e) {
    const messages = $$(".panel--middle li");
    revSelectedIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        const t = messages.length < 300 ? ((messages.length - 1) * 5) - (5 * i) : 0;
        let ms = messages[i];
        setTimeout(function() {
            ms.classList.add("transition-leave");
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

const dropImage = $('.panel--bottom');
dropImage.addEventListener('dragover', function send_image_dragover(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
    $('.textField').setAttribute("placeholder", "Drop image here");
    $('.panel--bottom').style.background = "#454d6f";
}, false);
dropImage.addEventListener('dragleave', function send_image_leave(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $('.panel--bottom').removeAttribute("style");
    $('.textField').setAttribute("placeholder", "Type message here");

}, false);
dropImage.addEventListener('drop', function send_image_drop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let files = evt.dataTransfer.files;
    $('.panel--bottom').removeAttribute("style");
    $('.textField').setAttribute("placeholder", "Type message here");
    appendImage(socket, files);
}, false);


/*****************************************************************
 * 
 *  Delete sent messages
 * 
 *****************************************************************/
let revSelectedIndex = -1;
$(".panel--middle").addEventListener('click', function delete_sent_messages(e) {
    if (e.target && hasClass(e.target, 'reverse') || hasClass(e.target.parentNode, 'reverse')) {
        const messageDiv = hasClass(e.target.parentNode, 'reverse') ? e.target.parentNode.parentNode : e.target.parentNode;
        const mid = messageDiv.getAttribute("data-mid");
        if (e.ctrlKey) {
            if (typeof messageDiv.getAttribute("data-selected") === undefined || messageDiv.getAttribute("data-selected") == null) {
                messageDiv.classList.add("toDelete");
                messageDiv.setAttribute("data-selected", mid);
                const nodes = Array.prototype.slice.call($$(".from__me")),
                    liRef = messageDiv;
                revSelectedIndex = nodes.indexOf(liRef);
            } else {
                messageDiv.classList.remove("toDelete");
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
                    $$(".from__me")[i].classList.add("toDelete");
                    $$(".from__me")[i].setAttribute("data-selected", $$(".from__me")[i].getAttribute("data-mid"));
                }
            } else {
                for (let i = revSelectedIndex; i >= index; i--) {
                    $$(".from__me")[i].classList.add("toDelete");
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

socket.on("reverseMessage", function socket_reverseMessage(mid) {
    const ms = $$(`[data-mid="${mid}"]`);
    for (let i = 0; i < ms.length; i++) {
        let mess = ms[i];
        if (typeof mess !== undefined && mess != null) {
            for (let i = 0; i < $$(".from__me[data-selected]").length; i++) {
                $$(".from__me[data-selected]")[i].classList.remove("toDelete");
                $$(".from__me[data-selected]")[i].removeAttribute("data-selected");
            }
            if (hasClass(mess, 'modal__div')) {
                $(".gallery__cont").classList.remove("anim--opacity");
                $(".img__div").classList.remove("anim--scale");
                $(".modal__div").classList.remove("anim--opacity");
                setTimeout(function remove_image_popup() {
                    mess.remove();
                }, 200);
            }
            setTimeout(function remove_message() {
                if (hasClass(mess, 'from__me')) {
                    if (mess.querySelector(".reverse"))
                        mess.querySelector(".reverse").remove();
                    mess.querySelector(".message").innerHTML = "You removed a message";
                } else {
                    mess.querySelector(".message").innerHTML = "Message removed";
                }
                mess.classList.add("ms--removed");
                mess.querySelector(".message").classList.remove("message--image");
                mess.querySelector(".message").classList.add("italic");
            }, 200);
        }
    }

});


/*****************************************************************
 *  TODO
 *  User typing notification
 * 
 *****************************************************************/
let userTyping = [];
let timeout;
socket.on("typing", function socket_typing(mid) {
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
    timeout = setTimeout(function remove_typing() {
        const el = $$(".who-typer");
        for (let i = 0; i < el.length; i++) {
            const user = el[i].getAttribute("data-user");
            userTyping.splice(userTyping.indexOf(user), 1);
        }
        if ($$(".typing").length > 0) $(".typing").remove();
    }, 1500);
});


/*****************************************************************
 * 
 *  Manage your sessions, popups
 * 
 *****************************************************************/

socket.on("activeSessions", function socket_activeSessions(data) {
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
    $(".settings--popup").addEventListener("click", function settings_popup_click() {
        socket.emit("activeSessions", true, function socket_activeSessions_popup(data) {
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
document.addEventListener('click', function doc_click(e) {
    if (e.target && hasClass(e.target, 'tost') || hasClass(e.target.parentNode, 'tost')) {
        middleDiv.scrollTop = middleDiv.scrollHeight;
        if (hasClass(e.target, 'tost')) e.target.classList.add("tost-leave");
        else e.target.parentNode.classList.add("tost-leave");
        setTimeout(function tost_remove() {
            if (hasClass(e.target, 'tost')) e.target.remove();
            else e.target.parentNode.remove();
        }, 300);
    }
    else if (e.target && hasClass(e.target, 'modal__exit') || hasClass(e.target.parentNode, 'modal__exit')) {
        $(".gallery__cont").classList.remove("anim--opacity");
        $(".img__div").classList.remove("anim--scale");
        $(".modal__div").classList.remove("anim--opacity");
        setTimeout(function modal_exit() {
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
        });
       
    } else if (e.target && hasClass(e.target, 'remove--session') || hasClass(e.target.parentNode, 'remove--session')) {
        const btn = hasClass(e.target.parentNode, 'remove--session') ? e.target.parentNode : e.target;
        const socketId = btn.parentNode.getAttribute("data-socketid");
        socket.emit("removeSession", socketId, function socket_EmitRemoveSession(data) {
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
    } else if (e.target && hasClass(e.target, 'room--change') || hasClass(e.target.parentNode, 'room--change') || hasClass(e.target.parentNode.parentNode, 'room--change')) {
        const btn = hasClass(e.target.parentNode, 'room--change') ? e.target.parentNode : hasClass(e.target.parentNode.parentNode, 'room--change')? e.target.parentNode.parentNode : e.target;
        if(!hasClass(btn,"room--active")){
            const rid = btn.getAttribute("data-rid");
            location.hash = `/${encodeURIComponent(rid)}`;
            if($$(".panel--middle li").length > 0 && hasClass($$(".panel--middle li")[$$(".panel--middle li").length-1], "info--change"))
                $$(".panel--middle li")[$$(".panel--middle li").length-1].remove();
            if($(".modal__div")){
                $(".settings__cont").classList.remove("anim--opacity", "anim--scale");
                $(".modal__div").classList.remove("anim--opacity");
                setTimeout(function() {
                    $(".modal__div").remove();
                }, 300);
            }
        }
    } else if (e.target && hasClass(e.target, 'changeRoom') || hasClass(e.target.parentNode, 'changeRoom')) {
        const btn = hasClass(e.target.parentNode, 'changeRoom') ? e.target.parentNode : e.target;
        const HTML = `<div class="modal__div">
                            <div class="settings__cont rooms__cont">
                                <div class="settings__exit noselect"><i class="material-icons">close</i></div>
                                <div class="title noselect">Rooms</div>
                                <p class="description noselect">Change chat room.</p>
                                <div class="subtitle noselect">Available rooms</div>
                                <ul class="rooms noselect rooms--modal"></ul>
                                <div class="footer">
                                    <div class="branding noselect">1.1.0</div>
                                    <div class="branding"><a href="https://github.com/maeek/vv-chat">Github</a></div>
                                </div>
                            </div>
                        </div>`;
            appendDOM(HTML, 'body', false);
            $(".modal__div").classList.add("anim--opacity");
            $(".settings__cont").classList.add("anim--opacity", "anim--scale");
            socket.emit("roomList", true);
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
                                    <div class="branding noselect">1.1.0</div>
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
                    appendDOM(`<i class="select__icon" data-index="${emojis.list[i]}">${uniCode}</i>`, '.room__icons');
                }
            }).catch(() => {
                $(".room__icons").innerHTML="";
                appendDOM(`<i class="material-icons noselect failed-to-fetch">warning</i>`, ".room__icons");
            });
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



/*****************************************************************
 *  
 *  User join/leave/rooms
 * 
 *****************************************************************/


socket.on("roomList", function socket_roomList(list) {
    for (let r = 0; r < $$(".rooms").length; r++)
        $$(".rooms")[r].innerHTML = "";
    for (let i = 0; i < list.length; i++) {
        const uni = list[i].icon.indexOf("-") != -1 ? list[i].icon.split("-") : [list[i].icon];
        let uniCode = "";
        for (let j = 0; j < uni.length; j++) {
            uniCode += String.fromCodePoint(parseInt(uni[j], 16));
        }
        const activeRoom = location.hash ? decodeURIComponent(location.hash.substring(2)) == list[i].id ? "room--active" : "" : i==0?"room--active":"";
        const HTML = `<li class="room--change ${activeRoom}" data-icon="${uniCode}" data-rid="${list[i].id}"><i>${uniCode}</i> <div class="room--details">${list[i].name} <div class="room--count">Online: ${list[i].online}</div></div></li>`;
        appendDOM(HTML, '.rooms', false);
    }
    if ($(".rooms--modal")) {
        for (let i = 0; i < list.length; i++) {
            const uni = list[i].icon.indexOf("-") != -1 ? list[i].icon.split("-") : [list[i].icon];
            let uniCode = "";
            for (let j = 0; j < uni.length; j++) {
                uniCode += String.fromCodePoint(parseInt(uni[j], 16));
            }
            const activeRoom = location.hash ? decodeURIComponent(location.hash.substring(2)) == list[i].id ? "room--active" : "" : i==0?"room--active":"";
            const HTML = `<li class="room--change ${activeRoom}" data-icon="${uniCode}" data-rid="${list[i].id}"><i>${uniCode}</i> <div class="room--details">${list[i].name} <div class="room--count">Online: ${list[i].online}</div></div></li>`;
            appendDOM(HTML, '.rooms--modal', false);
        }
    }
});

socket.on("userConnected", function socket_userConnected(data) {
    if (!data.self) {
        const time = getTime();
        const HTML = `<li class="joined"><span class="line"></span><span>${escapeHtml(data.username)} ${data.status?"joined chat":"left chat"} - ${time}</span><span class="line"></span></li>`;
        appendDOM(HTML, ".panel--middle");
    } else {
        if(!location.hash){
            $(".rooms--title").innerHTML = ""; 
            let uni = data.roomIcon.indexOf("-") != -1?data.roomIcon.split("-"):[data.roomIcon];
            let uniCode="";
            for(let j = 0; j< uni.length;j++){
                uniCode += String.fromCodePoint(parseInt(uni[j], 16));
            }
            appendDOM(`<i>${uniCode}</i> <span>${data.roomName}</span>`, '.rooms--title');
        }
    }
    $("#uc").innerHTML = data.users;
    socket.emit("roomList", true);
});
socket.on("changeRoom", function socket_changeRoom(rid) {
    location.hash = `/${rid}`;
});
if(location.hash){
    let hash = location.hash;
    let rid = decodeURIComponent(hash.substring(2));
    socket.emit("changeRoom", rid, function socket_EmitChangeRoom(roomInfo) {
        if(rid !== roomInfo.id){
            location.hash = `/${roomInfo.id}`;
        } else {
            $(".rooms--title").innerHTML = ""; 
            let uni = roomInfo.icon.indexOf("-") != -1?roomInfo.icon.split("-"):[roomInfo.icon];
            let uniCode="";
            for(let j = 0; j< uni.length;j++){
                uniCode += String.fromCodePoint(parseInt(uni[j], 16));
            }
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
    socket.emit("userConnected", null);
}
window.addEventListener("hashchange",function win_hashchange(){
    let hash = location.hash;
    let rid = decodeURIComponent(hash.substring(2));
    const rooms = $$(".room--change");
    for(let i = 0; i< rooms.length; i++) {
        rooms[i].classList.remove("room--active");
    }
    const selRooms = $$(`.room--change[data-rid="${rid}"]`);
    for(let i = 0; i< selRooms.length; i++) {
        selRooms[i].classList.add("room--active");
    }        
    socket.emit("changeRoom", rid, function socket_EmitChangeRoom2(roomInfo) {
        if(rid !== roomInfo.id){
            location.hash = `/${roomInfo.id}`;
        } else {
            socket.emit("roomList", true);
            $(".rooms--title").innerHTML = "";        
            let uni = roomInfo.icon.indexOf("-") != -1?roomInfo.icon.split("-"):[roomInfo.icon];
            let uniCode="";
            for(let j = 0; j< uni.length;j++){
                uniCode += String.fromCodePoint(parseInt(uni[j], 16));
            }
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
},false);