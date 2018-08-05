// ==UserScript==
// @name         Github notification check
// @namespace    https://github.com/eternal-flame-AD/tampermonkey-scripts
// @version      0.1
// @description  Github notifications
// @author       eternal-flame-AD
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const parseHTML =function(aHTMLString){
        var dom =document.implementation.createHTMLDocument('');
        dom.documentElement.innerHTML =aHTMLString;
        return dom;
    };
    const checkNotification =async function(){
        var res = await (await fetch("https://github.com/notifications", {
            credentials: "same-origin"
        })).text();
        var dom = parseHTML(res);
        return parseInt(dom.querySelector("ul.filter-list").querySelector("span").innerText);
    };
    const spawnNotification =function(body, icon, title) {
        var options = {
            body: body,
            icon: icon
        };
        var n = new Notification(title, options);
    };
    var unread =true;
    const startWatch =()=>{
        setInterval(()=>{
            checkNotification().then(count=>{
                if (count!==0) {
                    if (unread) spawnNotification(`You have ${count} notifications.`,"https://assets-cdn.github.com/favicon.ico","Github notification");
                    unread =false;
                } else {
                    unread =true;
                };
            });
        }, 30000);
    };
    switch (Notification.permission) {
        case "granted":
            startWatch();
            break;
        case "default":
            Notification.requestPermission().then((permission)=>{
                if ((permission)=="granted") startWatch();
            });
            break;
        case "denied":
            break;
    };
})();