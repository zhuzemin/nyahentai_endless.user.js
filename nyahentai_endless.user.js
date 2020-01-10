// ==UserScript==
// @name        nyahentai Endless
// @namespace   nyahentai_endless
// @supportURL  https://github.com/zhuzemin
// @description nyaHentai 无尽载入下页
// @include     https://en.nyahentai3.com/*
// @include     https://zh.nyahentai.co/*
// @include     https://ja.nyahentai.net/*
// @version     1.0
// @grant       GM_xmlhttpRequest
// @grant         GM_registerMenuCommand
// @grant         GM_setValue
// @grant         GM_getValue
// @run-at      document-start
// @author      zhuzemin
// @license     Mozilla Public License 2.0; http://www.mozilla.org/MPL/2.0/
// @license     CC Attribution-ShareAlike 4.0 International; http://creativecommons.org/licenses/by-sa/4.0/
// ==/UserScript==
var config = {
    'debug': true
}
var debug = config.debug ? console.log.bind(console)  : function () {
};

function onScroll(e) {
    var y = window.scrollY;
    // if (scroll_events === 0) old_scrollY = y; // stops only if scroll position was on 2. page
    var delta = e.deltaY || y - old_scrollY; // NOTE: e.deltaY for "wheel" event
    if (delta > 0 && (window.innerHeight + y) >= (document.body.clientHeight - (window.innerHeight * request_pct))) {
        console.log("scroll end");
        window.removeEventListener(event_type, onScroll, false);

        try {
            requestNextPage(next_link || document.getElementById("pnnext").href);
        } catch (err) {
            console.error(err.name + ": " + err.message);
            // NOTE: recovery unnecessary, input event handles it with reset on new search
        }
    }
    old_scrollY = y;
    scroll_events += 1;
}


class Content{
    constructor(href) {
        this.method = 'GET';
        this.url = href;
        this.headers = {
            'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
            'Accept': 'application/atom+xml,application/xml,text/xml',
            'Referer': window.location.href,
        };
        this.charset = 'text/plain;charset=utf8';
    }
}


function requestNextPage(link) {
    var next=document.querySelector("span.next");
    var a=next.querySelector("a");
    var content=Content(a.href);
    request();
}

var init = function () {
    var event_type = "scroll"; // or "wheel"

    window.addEventListener(event_type, onScroll, false);
    window.addEventListener("beforeunload", function () {
        window.scrollTo(0, 0);
    }, false);

}


function request(object,parentNode) {
    var retries = 10;
    GM_xmlhttpRequest({
        method: object.method,
        url: object.url,
        headers: object.headers,
        overrideMimeType: object.charset,
        //synchronous: true
        onload: function (responseDetails) {
            if (responseDetails.status != 200) {
                // retry
                if (retries--) {          // *** Recurse if we still have retries
                    setTimeout(request(),2000);
                    return;
                }
            }
            debug(responseDetails);
            var html = new DOMParser().parseFromString(responseDetails.responseText, "text/html");
            //debug(galleryHtml);
            //Dowork
            var content = html.querySelector('#content');
            parentNode.insertBefore(content,null);
        }
    });
}


window.addEventListener('DOMContentLoaded', init);
