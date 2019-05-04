/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.1.0
 * 
 */


function getUsers() {
    $(".users__table").innerHTML = "";
    appendDOM(`<li class="user--record user--add">Add user <i class="material-icons">add</i></li>
                <li class="loader__div">
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
                </li>`, '.users__table');
    fetch("/manage", {
        body: JSON.stringify({
            action: "getUsers"
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST"
    }).then(data => data.json()).then(users => {
        $(".users__table").innerHTML = "";
        appendDOM(`<li class="user--record user--add">Add user<i class="material-icons">add</i></li>
                    <li class="loader__div">
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
                    </li>`, '.users__table');
        for (let i = 0; i < users.length; i++) {
            const user = users[i].username;
            const HTML = `<li class="user--record">
                        <div class="who noselect">${user.substring(0,1).toUpperCase()}</div>
                        <div class="user--name">${user}</div>
                        <div class="actions noselect" data-user="${user}">
                            <div class="user--reset"><i class="material-icons">vpn_key</i></div>
                            <div class="user--input"><i title="Generate password" class="material-icons reset--pass">refresh</i><input type="text" readonly value="···"><i title="Copy to clipboard" class="material-icons copy__clipboard ${!navigator.clipboard?"nodisplay":""}">file_copy</i></div>
                            <div class="user--remove"><i class="material-icons">delete</i></div>
                        </div>
                    </li>`;
            appendDOM(HTML, ".users__table");

        }
        $(".panel--middle .loader__div").remove();
    }).catch(() => {
        $(".panel--middle .loader__div").innerHTML = "";
        appendDOM(`<i class="material-icons noselect failed-to-fetch">warning</i>`, ".panel--middle .loader__div");
        error(`Connection failed`);
    });
}

let socket = io.connect(`/chat`, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10
});
socket.emit("roomList", true);
socket.on("roomList", function(list) {
    for (let r = 0; r < $$(".rooms").length; r++) {
        $$(".rooms")[r].innerHTML = "";
    }
    for (let i = 0; i < list.length; i++) {
        let uni = list[i].icon.indexOf("-") != -1 ? list[i].icon.split("-") : [list[i].icon];
        let uniCode = "";
        for (let j = 0; j < uni.length; j++) {
            uniCode += String.fromCodePoint(parseInt(uni[j], 16));
        }
        let HTML = `<li class="room--change" data-icon="${uniCode}" data-rid="${list[i].id}"><i>${uniCode}</i> ${list[i].name}<div class="room--count">${list[i].online}</div><i class="material-icons roomDelete">delete</i></li>`;
        appendDOM(HTML, '.rooms', false);
    }
    appendDOM(`<li class="room--show">Show rooms</li>`, '.rooms', false);
    if ($(".rooms--modal")) {
        for (let i = 0; i < list.length; i++) {
            let uni = list[i].icon.indexOf("-") != -1 ? list[i].icon.split("-") : [list[i].icon];
            let uniCode = "";
            for (let j = 0; j < uni.length; j++) {
                uniCode += String.fromCodePoint(parseInt(uni[j], 16));
            }
            let HTML = `<li class="room--change" data-icon="${uniCode}" data-rid="${list[i].id}"><i>${uniCode}</i> ${list[i].name}<div class="room--count">${list[i].online}</div><i class="material-icons roomDelete">delete</i></li>`;
            appendDOM(HTML, '.rooms--modal', false);
        }
    }
});


window.addEventListener("DOMContentLoaded", function() {
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


    window.addEventListener("resize", function() {
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
    getUsers();
});
document.addEventListener('click', function(e) {
    if (e.target && hasClass(e.target, 'user--reset') || hasClass(e.target.parentNode, 'user--reset')) {
        const s = hasClass(e.target, 'user--reset') ? e.target : e.target.parentNode;
        if (!s.classList.contains("reset--show")) {

            s.parentNode.querySelector(".user--input").style.width = "auto";
            let ww = s.parentNode.querySelector(".user--input").offsetWidth;
            s.parentNode.querySelector(".user--input").style.width = "0";
            setTimeout(function() {
                s.parentNode.querySelector(".user--input").style.width = ww + "px";
                s.querySelector("i").innerHTML = "keyboard_arrow_right";
            }, 100)
            s.classList.add("reset--show");
        } else {
            s.parentNode.querySelector(".user--input").removeAttribute("style");
            s.querySelector("i").innerHTML = "vpn_key";
            s.classList.remove("reset--show");
            s.parentNode.querySelector("input").value = "···";
        }
    } else if (e.target && hasClass(e.target, 'copy__clipboard')) {
        if ('clipboard' in navigator) navigator.clipboard.writeText(e.target.parentNode.querySelector("input").value);
    } else if (e.target && hasClass(e.target, 'user--remove') || hasClass(e.target.parentNode, 'user--remove')) {
        const s = hasClass(e.target, 'user--remove') ? e.target : e.target.parentNode;
        const user = s.parentNode.getAttribute("data-user");
        fetch("/manage", {
                body: JSON.stringify({
                    action: "deleteUser",
                    user: user
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "POST"
            }).then(data => data.json())
            .then(res => {
                if (res.status) {
                    s.parentNode.parentNode.classList.add("user--record-remove");
                    setTimeout(function() {
                        s.parentNode.parentNode.remove();
                    }, 200);
                } else {
                    error(`Couldn't remove user.`);
                }
            }).catch(() => {
                error(`Connection failed`);
            });
    } else if (e.target && hasClass(e.target, 'reset--pass')) {
        const user = e.target.parentNode.parentNode.getAttribute("data-user");
        fetch("/manage", {
                body: JSON.stringify({
                    action: "resetPassword",
                    user: user
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "POST"
            }).then(data => data.json())
            .then(res => {
                if (res.status)
                    e.target.parentNode.querySelector("input").value = res.password;
                else
                    error(`Failed to reset password`);
            }).catch(() => {
                error(`Connection failed`);
            });
    } else if (e.target && hasClass(e.target, 'user--add') || hasClass(e.target.parentNode, 'user--add')) {
        const HTML = `<li class="user--record user--add-cont">
                        <div class="user--name"><input name="newUser" type="text" maxlength="30" placeholder="Type new user name. At least 3 letters"></div>
                        <div class="actions noselect">
                            <div class="user--cancel"><i class="material-icons">close</i></div>
                            <div class="user--confirm"><i class="material-icons">add</i></div>
                        </div>
                        <div class="invalidText">You entered characters that are considered not safe</div>
                    </li>`;
        if ($$('.user--add-cont').length == 0) {
            appendDOM(HTML, '.users__table');
            $(".user--add-cont").classList.add("user--add-transition");
            $('input[name="newUser"]').focus();
            $('.user--cancel').addEventListener('click', function() {
                $(".user--add-cont").classList.remove("user--add-transition");
                setTimeout(function() {
                    $('.user--add-cont').remove();
                }, 200);
            });
        }
    } else if (e.target && hasClass(e.target, 'user--confirm') || hasClass(e.target.parentNode, 'user--confirm')) {
        const name = $('input[name="newUser"]').value.toLowerCase().trim();
        const format = /^[AaĄąĆćĘęŁłŃńÓóSsŚśŹźŻża-zA-Z0-9@!\.\-]+$/;
        if (name.length > 2 && name != "" && name.length <= 30 && format.test(name)) {
            fetch("/manage", {
                    body: JSON.stringify({
                        action: "createUser",
                        user: name
                    }),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: "POST"
                }).then(data => data.json())
                .then(res => {
                    if (res.status) {
                        const HTML = `<li class="user--record">
                                <div class="who noselect">${res.user.toUpperCase().substring(0,1)}</div>
                                <div class="user--name">${res.user}</div>
                                <div class="actions noselect" data-user="${res.user}">
                                    <div class="user--reset reset--show"><i class="material-icons">keyboard_arrow_right</i></div>
                                    <div class="user--input" style="width:auto"><i title="Generate password" class="material-icons reset--pass">refresh</i><input type="text" readonly value="···"><i title="Copy to clipboard" class="material-icons copy__clipboard ${!navigator.clipboard?"nodisplay":""}">file_copy</i></div>
                                    <div class="user--remove"><i class="material-icons">delete</i></div>
                                </div>
                            </li>`;

                        $('.user--add-cont').remove();
                        appendDOM(HTML, '.users__table');
                        const newDiv = $$(".user--record .actions");
                        let ww = newDiv[newDiv.length - 1].querySelector(".user--input").offsetWidth;
                        newDiv[newDiv.length - 1].querySelector(".user--input").style.width = "0";
                        setTimeout(function() {
                            newDiv[newDiv.length - 1].querySelector(".user--input").style.width = ww + "px";
                        }, 100)
                        newDiv[newDiv.length - 1].querySelector("input").value = res.password;
                    } else {
                        error(`Failed to create user`);
                    }

                }).catch(() => {
                    error(`Connection failed`);
                });
        } else {
            $(".invalidText").style.display = "block";
            $(".invalidText").style.opacity = 1;
            $('input[name="newUser"]').focus();
        }
    }
});
$(".refresh--users").addEventListener("click", function() {
    getUsers();
}, false);

document.addEventListener('click', function(e) {
    if (e.target && hasClass(e.target, 'room--show') || hasClass(e.target.parentNode, 'room--show')) {
        const btn = hasClass(e.target.parentNode, 'room--show') ? e.target.parentNode : e.target;
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
                                        <input type="text" name="roomName" placeholder="Type new room name" maxlength="30" autocomplete="off">
                                    </div>    
                                </div>
                                <div class="subtitle noselect">Select icon</div>
                                <div class="input__div no--side-padd">
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
            $(".room__icons").innerHTML = "";
            for (let i = 0; i < emojis.list.length; i++) {
                let uni = emojis.list[i].indexOf("-") != -1 ? emojis.list[i].split("-") : [emojis.list[i]];
                let uniCode = "";
                for (let j = 0; j < uni.length; j++) {
                    uniCode += String.fromCodePoint(parseInt(uni[j], 16));
                }
                appendDOM(`<i class="select__icon" data-index="${emojis.list[i]}">${uniCode}</i>`, '.room__icons');
            }
        }).catch(() => {
            $(".room__icons").innerHTML = "";
            appendDOM(`<i class="material-icons noselect failed-to-fetch">warning</i>`, ".modal__div .room__icons");
        });
        $(".modal__div").classList.add("anim--opacity");
        $(".settings__cont").classList.add("anim--opacity", "anim--scale");
    } else if (e.target && hasClass(e.target, 'select__icon')) {
        const icons = $$(".select__icon");
        for (let i = 0; i < icons.length; i++)
            icons[i].classList.remove("icon--active");
        e.target.classList.add("icon--active");
        $(".icon--prev").innerHTML = e.target.innerHTML;
    } else if (e.target && hasClass(e.target, 'roomDelete')) {
        e.stopPropagation();
        const rid = e.target.parentNode.getAttribute("data-rid");
        socket.emit("deleteRoom", rid);
    } else if (e.target && hasClass(e.target, 'create--room') || hasClass(e.target.parentNode, 'create--room')) {
        const roomName = $("input[name='roomName']").value.trim();
        const icon = $(".icon--active") ? $(".icon--active").getAttribute("data-index") : null;
        socket.emit("addRoom", {
            name: roomName,
            icon: icon
        }, (res) => {
            if (!res.status) {
                error(res.message);
            } else {
                $(".settings__cont").classList.remove("anim--opacity", "anim--scale");
                $(".modal__div").classList.remove("anim--opacity");
                setTimeout(function() {
                    $(".modal__div").remove();
                }, 300);
            }
        });
    }
});
document.addEventListener('input', function(e) {
    if (e.target.getAttribute("name") == "roomName") {
        const format = /^[AaĄąĆćĘęŁłŃńÓóSsŚśŹźŻża-zA-Z0-9@!\.\-\s]+$/;
        const val = e.target.value;
        if (format.test(val)) {
            $(".room--name--prev").innerHTML = val;
        } else if (val.trim().length == 0) {
            $(".room--name--prev").innerHTML = "Type room name in the field above";
        } else if (val.trim().length > 30) {
            $(".room--name--prev").innerHTML = "Maximum length is 30";
        } else {
            $(".room--name--prev").innerHTML = "Room name can only contain a-z A-Z 0-9 -@!.";
        }
    }
});