// ==UserScript==
// @name         Zhan.com nologin
// @namespace    https://github.com/eternal-flame-AD/tampermonkey-scripts
// @version      0.1
// @description  去除小站登陆界面，拒绝骚扰电话
// @author       eternal-flame-AD
// @match        http://top.zhan.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var target = document.querySelector("body");
    var config = { attributes: false, childList: true, subtree: false };

    var observer = null;

    var remove = function () {
        if (document.querySelector("div.bg_player_login")) {
            console.log("Removing login background");
            document.body.style = "overflow: auto !";
            document.querySelector("div.regist_view_pop").remove();
            document.querySelector("div.bg_player_login").remove();
            observer.disconnect();

            var duration = getDuration();
            $("#practice_timer").text(timer_text(duration));
            timer = setInterval(function() {
                duration++;
                $("#practice_timer").text(timer_text(duration));
                window.curTimer = duration;
            },1000);
        }
    };

    observer = new MutationObserver(remove);
    observer.observe(target, config);

})();
