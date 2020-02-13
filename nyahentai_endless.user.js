// ==UserScript==
// @name        nhentai_endless
// @namespace   nhentai_endless
// @supportURL  https://github.com/zhuzemin
// @description nhentai automate next page
// @include     https://nhentai.net/*
// @include     https://en.nyahentai3.com/*
// @include     https://zh.nyahentai.co/*
// @include     https://ja.nyahentai.net/*
// @include     https://zh.nyahentai.pro/*
// @include     https://nhentai.net/
// @include     https://en.nyahentai3.com/
// @include     https://zh.nyahentai.co/
// @include     https://ja.nyahentai.net/
// @include     https://zh.nyahentai.pro/
// @version     1.12
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
    'debug': false
}
var debug = config.debug ? console.log.bind(console)  : function () {
};

var old_scrollY = 0;
var request_pct = 0.05; // percentage of window height left on document to request next page, value must be between 0-1

var scroll_events = 0;
var event_type = "scroll"; // or "wheel"

function onScroll(e) {
    var y = window.scrollY;
    // if (scroll_events === 0) old_scrollY = y; // stops only if scroll position was on 2. page
    var delta = e.deltaY || y - old_scrollY; // NOTE: e.deltaY for "wheel" event
    if (delta > 0 && (window.innerHeight + y) >= (document.body.clientHeight - (window.innerHeight * request_pct))) {
        debug("scroll end");
        window.removeEventListener(event_type, onScroll, false);

        try {
            requestNextPage();
        } catch (err) {
            debug(err.name + ": " + err.message);
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


function requestNextPage() {
    var nexts=document.querySelectorAll("span.next");
    var next=nexts[nexts.length-1];
    var a=next.querySelector("a");
    debug("href: "+a.href);
    var content=new Content(a.href);
    var parentNode=document.querySelector('#content');
    request(content,parentNode);
}

var init = function () {
    setInterval(function(){
    window.addEventListener(event_type, onScroll, false);
    window.addEventListener("beforeunload", function () {
        window.scrollTo(0, 0);
    }, false);
    }, 3000);
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
