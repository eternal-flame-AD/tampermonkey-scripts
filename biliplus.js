// ==UserScript==
// @name             Biliplus integration
// @namespace https://github.com/eternal-flame-AD/tampermonkey-scripts
// @version      0.1
// @description  BiliPlus integration in Bilibili
// @author      eternal-flame-AD
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://www.bilibili.com/video/av*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const sleep =(time)=>new Promise((res, rej)=>{
        setTimeout(res, time);
    });
    const openNewWindow =(html, title=document.title)=>{
        let win =window.open(document.URL ,'_blank');
        if (!win) {
            alert('Popup failed');
        } else {
            win.document.write(html);
            win.document.title = title;
        }
    };
    const parseVideoPartsData = (partdata)=>{
        var resList = [];
        for (var index in partdata) {
            var res = new BiliPlusSplitVideoUrl(partdata[index]);
            resList.push(res);
        }
        return resList;
    }

    class BiliPlusSplitVideoUrl {
        constructor(data){
            this.duration = data.length.split(" ")[0];
            this.size     = data.length.split(" ")[1];
            this.url      = data.url;
        }
    }
    class BiliPlusVideoData {
        constructor(data, pid=1){
            this.pid  = pid;
            this.type = data.type;
            this.name = data.name;
            this.info = data.info;
            this.vurl = data.url?data.url:parseVideoPartsData(data.parts);
        }
    }

    let PageType=null;
    switch (true) {
    case (!!document.URL.match(/https:\/\/www.bilibili.com\/bangumi\/play.*/)): PageType = "play_bangumi"; break;
    case (!!document.URL.match(/https:\/\/www.bilibili.com\/video\/av.*/)): PageType = "play_video"; break;
    default: console.error("Unknown PageType"); break;
    }
    if (PageType) {
        var button = document.createElement("div");
        button.setAttribute("class", "bgray-btn show bgray-btn-biliplus");
        button.style = "height 25px; margin-top:5px";
        var buttonMultiple = button.cloneNode(true);
        buttonMultiple.innerText = "BP\nMP";
        button.innerText = "BP";
        var videos = [];
        var avID = null;
        switch (PageType) {
            case "play_video":avID = document.URL.match(/www.bilibili.com\/video\/av(\d+)/)[1]; break;
            case "play_bangumi":avID = document.getElementsByClassName("info-sec-av")[0].getAttribute("href").match(/www.bilibili.com\/video\/av(\d+)/)[1]; break;
        }
        setTimeout(
            function _self(){
                var insertPoint = document.getElementsByClassName("bgray-btn-wrap")[0];
                if (insertPoint) {
                    switch (PageType) {
                        case "play_video":
                            for (var i=1;i<=window.__INITIAL_STATE__['videoData']['videos'];i++) {
                                videos.push({
                                    id: avID,
                                    page:i,
                                });
                            };
                            break;
                        case "play_bangumi":
                            for (var ep of window.__INITIAL_STATE__.epList) {
                                videos.push({
                                    id: ep.aid,
                                    page:1,
                                });
                            };
                            break;
                    };
                    insertPoint.appendChild(button);
                    if (videos.length>1) insertPoint.appendChild(buttonMultiple);
                } else {
                    setTimeout(_self);
                };
            }
        );

        const parseSingleP = async (id, page=1, bangumi=false)=>{
            let queryURL = `https://www.biliplus.com/api/geturl?av=${id}&page=${page}&bangumi=${bangumi?1:0}`;
            var res=null;
            while (!res) {
                try{
                    res = await fetch(queryURL);
                }catch(e){
                    console.error(e);
                    sleep(5000);
                }
            }
            var res = await fetch(queryURL);

            var jsonres = await res.json();
            var parseresult = [];
            for (var key in jsonres['data']) {
                parseresult.push(new BiliPlusVideoData(jsonres['data'][key], page));
            };
            return parseresult;
        };
        const resTable = function writeResTable(parseresult){
            var table = document.createElement("table");
            var head = table.createTHead();
            var headrow = head.insertRow();
            for (let tableHead of ['P', "type", "name", "info", "url"]) {
                headrow.insertCell().innerText = tableHead;
            }
            var body = table.createTBody();
            for (var returnOption of parseresult) {
                var row = body.insertRow();
                row.insertCell().innerText = returnOption.pid;
                row.insertCell().innerText = returnOption.type;
                row.insertCell().innerText = returnOption.name;
                row.insertCell().innerHTML = returnOption.info;
                if (returnOption.vurl instanceof Array) {
                    console.log(returnOption.vurl.map((data)=>data.url));
                    row.insertCell().innerHTML = returnOption.vurl.map((data)=>data.url).join("<br />");
                } else {
                    row.insertCell().innerText = returnOption.vurl;
                }
            };
            openNewWindow(`
                <script src="https://unpkg.com/tablefilter@0.6.52/dist/tablefilter/tablefilter.js"></script>
                <table border="1px" class="filterable-table" id="result">${table.innerHTML}</table>
                <script>
                    var tf = new TableFilter(document.querySelector('.filterable-table'), {
                        base_path: 'https://unpkg.com/tablefilter@0.6.52/dist/tablefilter/'
                    });
                    tf.init();
                </script>
            `);
        };

        var parseResult = [];

        button.onclick = async ()=>{
            var originalText = button.innerText;
            button.innerText = "...";
            parseResult = await parseSingleP(avID, 1, PageType==="play_bangumi");
            resTable(parseResult);
            button.innerText = originalText;
        };
        buttonMultiple.onclick = async ()=>{
            var originalText = buttonMultiple.innerText;
            buttonMultiple.innerText = `0/${videos.length}`;
            parseResult = [];
            for (var index in videos) {
                var video = videos[index];
                parseResult.push(...await parseSingleP(video.id, video.page, PageType==="play_bangumi"));
                buttonMultiple.innerText = `${index}/${videos.length};`
            };
            buttonMultiple.innerText = originalText;
            resTable(parseResult);
        };
    };
    // Your code here...
})();