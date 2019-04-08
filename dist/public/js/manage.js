/*
 *   Author: maeek
 *   Description: No history simple websocket chat
 *   Github: https://github.com/maeek/vv-chat
 *   Version: 1.0.5
 * 
 */

function getUsers() {
    $(".users__table").innerHTML = "";
    appendDOM(`<li class="user--record user--add">
                    <div class="user--name">Add user</div>
                    <div class="actions noselect">
                        <div><i class="material-icons">add</i></div>
                    </div>
                </li>
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
        appendDOM(`<li class="user--record user--add">
                        <div class="user--name">Add user</div>
                        <div class="actions noselect">
                            <div><i class="material-icons">add</i></div>
                        </div>
                    </li>
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
                            <div class="user--input"><i title="Generate password" class="material-icons reset--pass">refresh</i><input type="text" readonly value="···"><i title="Copy to clipboard" class="material-icons copy__clipboard">file_copy</i></div>
                            <div class="user--remove"><i class="material-icons">delete</i></div>
                        </div>
                    </li>`;
            appendDOM(HTML, ".users__table");

        }
        $(".loader__div").remove();
    }).catch(() => {
        error(`Connection failed`);
    });
}
window.addEventListener("DOMContentLoaded", function() {
    const el = $(".panel--middle");
    const wh = (document.height !== undefined) ? document.height : document.body.offsetHeight;
    const calc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
    el.style["max-height"] = calc + "px";
    window.addEventListener("resize", function() {
        const el = $(".panel--middle");
        const wh = (document.height !== undefined) ? document.height : document.body.offsetHeight;
        const calc = wh - $(".panel--top").offsetHeight - $(".panel--bottom").offsetHeight;
        el.style["max-height"] = calc + "px";
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
        navigator.clipboard.writeText(e.target.parentNode.querySelector("input").value);
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
        if (name.length > 2 && name != "" && name.length <= 30) {
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
                                    <div class="user--input" style="width:auto"><i title="Generate password" class="material-icons reset--pass">refresh</i><input type="text" readonly value="···"><i title="Copy to clipboard" class="material-icons copy__clipboard">file_copy</i></div>
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
            $('input[name="newUser"]').focus();
        }
    }
});
$(".refresh--users").addEventListener("click", function() {
    getUsers();
}, false);