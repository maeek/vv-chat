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
navigator.browserSpecs = (function() {
    var ua = navigator.userAgent,
        tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return {
            name: 'IE',
            version: (tem[1] || '')
        };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return {
            name: tem[1].replace('OPR', 'Opera'),
            version: tem[2]
        };
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null)
        M.splice(1, 1, tem[1]);
    return {
        name: M[0],
        version: M[1]
    };
})();
const domFromText = function(html) {
    return new DOMParser().parseFromString(html, 'text/html').body.childNodes
};

function appendDOM(HTML, element) {
    const childNodes = domFromText(HTML);
    for (let i = 0; i < childNodes.length; i++) {
        document.querySelector(element).append(childNodes[i]);
    }
}
window.addEventListener("DOMContentLoaded", function() {
    document.querySelector('form').addEventListener('submit', function(e) {
        if (document.querySelector('input[name="username"]').value.trim().length > 1 && document.querySelector('input[name="password"]').value.trim().length > 4) {
            document.querySelector(".finger").innerHTML = "autorenew";
            document.querySelector(".finger").classList.add("spin");
            return true;
        } else {
            if (document.querySelector('input[name="username"]').value.trim().length < 1)
                document.querySelector('input[name="username"]').style["box-shadow"] = '0px 3px 1px #ff4747';
            if (document.querySelector('input[name="password"]').value.trim().length < 5)
                document.querySelector('input[name="password"]').style["box-shadow"] = '0px 3px 1px #ff4747';
            e.preventDefault();
            return false;
        }
    });
    let hash = location.hash.substring(1);
    switch (hash) {
        case "wrong":
            document.querySelector(".status__div").classList.add("statusError");
            document.querySelector(".status__div").innerHTML = 'You enterd wrong username or password';
            break;
        case "error":
            document.querySelector(".status__div").classList.add("statusError");
            document.querySelector(".status__div").innerHTML = 'Couldn\'t log in to this account';
            break;
        default:
            break;
    }

    function notSupported() {
        document.querySelector(".container").innerHTML = "";
        appendDOM('<div class="whatIsThis"><div class="cmon">You can do better than this!</div><div class="notsupported">This version of your browser is not supported. Update it or install any modern browser.</div><ul><li><a href="https://www.google.com/intl/en/chrome/">Chrome</a></li><li><a href="https://www.mozilla.org/en-US/firefox/">Firefox</a></li><li><a href="https://www.opera.com/">Opera</a></li></ul></div>', '.container', false);
    }
    const browser = navigator.browserSpecs;
    switch (browser.name) {
        case "Chrome":
            if (navigator.browserSpecs.version < 50)
                notSupported();
            break;
        case "Firefox":
            if (navigator.browserSpecs.version < 60)
                notSupported();
            break;
        case "Edge":
            if (navigator.browserSpecs.version < 13)
                notSupported();
            break;
        case "IE":
            notSupported();
            break;
        default:
            break;
    }
});