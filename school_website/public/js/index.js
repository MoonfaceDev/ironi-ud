var db = firebase.firestore();
var storage = firebase.storage();
var images = [];
var currentImage = 0;
const notifications = document.getElementById("notifications");
const menuItems = document.getElementById("menuItems");
let pageHistory = [];
let pages = [];
var timeout;

db.collection("pages").get().then(function (querySnapshot) {
    querySnapshot.forEach(doc => {
        pages.push(doc.data());
    });
    var leftPage = pages.find(data => data.name == "left_panel");
    loadLeftPanel(leftPage.html);
    if (window.location.pathname != "/") {
        var name = window.location.pathname.replace("/", "");
        var page = pages.find(data => data.name == name);
        loadPage(page.name, page.title, page.html);
    } else {
        var page = pages.find(data => data.name == "home");
        if(page == null){
            page = {name:"home",title:"ראשי",html:""};
        }
        var html = "<div id=\"gallery\"><div id=\"gallerySubtitle\"></div><img id=\"galleryImage\"><div id=\"galleryLoading\" class=\"ball-pulse-sync\"><div></div><div></div><div></div></div><a id=\"galleryRightArrow\" onclick=\"rotate(1)\">&#10094;</a><a id=\"galleryLeftArrow\" onclick=\"rotate(-1)\">&#10095;</a></div><div id=\"linkBoard\"></div>"+page.html;
        loadPage("",page.title,html);
        linkBoard = document.getElementById("linkBoard");
        galleryImage = document.getElementById("galleryImage");
        gallerySubtitle = document.getElementById("gallerySubtitle");
        galleryLoading = document.getElementById("galleryLoading");
        galleryImage.onload = function () {
            galleryLoading.style.display = "none";
            timeout = setTimeout(rotate, 3000, 1);
        }
        loadAddresses();
        loadLinkBoard();
    }
}).catch(function (error) {
    //TODO: Handle error
});

loadNotifications();
loadMenuBar();

function rotate(dir) {
    currentImage += dir;
    if (currentImage > images.length - 1) {
        currentImage -= images.length;
    } else if (currentImage < 0) {
        currentImage += images.length;
    }
    loadPicture(currentImage);
}

function loadAddresses() {
    galleryLoading.style.display = "block";
    db.collection("gallery").orderBy("order").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            images.push({ url: doc.data().url, title: doc.data().title });
            if (images.length == 1) {
                galleryLoading.style.display = "none";
                loadPicture(0);
            }
        });
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function loadNotifications() {
    db.collection("notifications").where("date", ">", firebase.firestore.Timestamp.now()).orderBy("date").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var notificationItem = document.createElement("li");
            var notificationTitle = document.createElement("div");
            var notificationInfo = document.createElement("div");
            var notificationDate = document.createElement("div");
            var timestamp = doc.data().date.toDate();
            var notificationTitleString = doc.data().title;
            const regex = /\[[^\[\]\(\)]*\]\([^\[\]\(\)]*\)/g;
            while (match = regex.exec(notificationTitleString)) {
                var matchIndex = match["index"];
                var matchString = match[0];
                var textEnd = matchString.indexOf("]");
                var matchText = matchString.substring(1,textEnd);
                var matchUrl = matchString.substring(textEnd+2, matchString.length-1);
                notificationTitleString = notificationTitleString.substring(0,matchIndex)+"<a target='_blank' href='"+matchUrl+"'>"+matchText+"</a>"+notificationTitleString.substring(matchIndex+matchString.length);
            }
            notificationTitle.innerHTML = notificationTitleString;
            notificationTitle.style.fontWeight = 'bold';
            notificationTitle.style.padding = "2px";
            notificationDate.textContent = formatDate(timestamp);
            notificationDate.style.display = "inline-block";
            notificationDate.style.padding = "2px";
            notificationInfo.appendChild(notificationDate);
            notificationItem.appendChild(notificationTitle);
            notificationItem.appendChild(notificationInfo);
            notificationItem.style.margin = "8px";
            notificationItem.style.padding = "2px";
            notificationItem.style.borderTop = "1px solid lightgrey";
            notificationItem.style.borderBottom = "1px solid lightgrey";
            notifications.appendChild(notificationItem);
        });
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function loadMenuBar() {
    db.collection("menu").orderBy("order").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var item = document.createElement("li");
            var link = document.createElement("a");
            link.textContent = doc.data().title;
            if (doc.data().type !== "none") {
                link.href = doc.data().link;
                if (doc.data().type === "link") {
                    link.target = "_blank";
                }
            }
            item.appendChild(link);
            menuItems.appendChild(item);
            loadMenuItemList(item, doc.data().list);
        });
    });
}

function loadMenuItemList(parent, data) {
    var list = document.createElement("ul");
    data.forEach(map => {
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.textContent = map["title"];
        link.href = map["link"];
        item.appendChild(link);
        list.appendChild(item);
    });
    list.style.display = "none";
    parent.appendChild(list);
    parent.addEventListener("click", function () { showNavMenu(parent); });
    parent.addEventListener("mouseover", function () { showNavMenu(parent); });
    parent.addEventListener("mouseleave", function () { hideNavMenu(parent); });
}

function loadLinkBoard() {
    db.collection("linkBoard").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var button = document.createElement("div");
            var link = document.createElement("a");
            link.textContent = doc.data().title;
            link.href = doc.data().link;
            if (doc.data().type === "link") {
                link.target = "_blank";
            }
            button.appendChild(link);
            linkBoard.appendChild(button);
        });
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function loadPage(name, title, html) {
    pageHistory.push({ "html": document.getElementById("content").innerHTML, "pageTitle": document.title });
    document.getElementById("mainTitle").innerHTML = title;
    document.getElementById("content").innerHTML = html;
    document.title = "עירוני י\"ד - " + title;
    window.history.pushState({ "html": html, "pageTitle": name }, "", "/" + name);
    document.getElementById("content").querySelectorAll('oembed[url]').forEach(element => {
        var url = element.attributes.url.value;
        var youtubeRegex = /youtube\.com\/watch\?v\=([a-z|A-Z|0-9|\-|_]+)/;
        var shortYoutubeRegex = /youtu\.be\/([a-z|A-Z|0-9|\-|_]+)/
        var mapsRegex = /\<iframe src\=\"https\:\/\/www\.google\.com\/maps\/embed\?pb\=([a-z|A-Z|0-9|!|\.|\%]+)\" width\=\"600\" height\=\"450\" frameborder\=\"0\" style\=\"border\:0\;\" allowfullscreen\=\"\" aria-hidden=\"false\" tabindex\=\"0\"\>\<\/iframe\>/;
        var youtubeMatch = url.match(youtubeRegex);
        var shortYoutubeMatch = url.match(shortYoutubeRegex);
        var mapsMatch = url.match(mapsRegex);
        var iframe = document.createElement("iframe");
        iframe.style.border = '0';
        iframe.frameBorder = '0';
        iframe.width = '100%';
        iframe.height = '450px';
        if (youtubeMatch != null) {
            iframe.src = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        if (shortYoutubeMatch != null) {
            iframe.src = `https://www.youtube.com/embed/${shortYoutubeMatch[1]}`;
        }
        if (mapsMatch != null) {
            iframe.src = `https://www.google.com/maps/embed?pb=${mapsMatch[1]}`;
        }
        iframe.allowFullscreen = true;
        element.append(iframe);
    });
    document.getElementById("content").querySelectorAll('*').forEach(element => {
        element.classList.add("ck-content");
    });
}

function loadLeftPanel(html) {
    document.getElementById("leftContent").innerHTML = html;
    document.getElementById("leftContent").querySelectorAll('oembed[url]').forEach(element => {
        var url = element.attributes.url.value;
        var youtubeRegex = /youtube\.com\/watch\?v\=([a-z|A-Z|0-9|\-|_]+)/;
        var shortYoutubeRegex = /youtu\.be\/([a-z|A-Z|0-9|\-|_]+)/
        var mapsRegex = /\<iframe src\=\"https\:\/\/www\.google\.com\/maps\/embed\?pb\=([a-z|A-Z|0-9|!|\.|\%]+)\" width\=\"600\" height\=\"450\" frameborder\=\"0\" style\=\"border\:0\;\" allowfullscreen\=\"\" aria-hidden=\"false\" tabindex\=\"0\"\>\<\/iframe\>/;
        var youtubeMatch = url.match(youtubeRegex);
        var shortYoutubeMatch = url.match(shortYoutubeRegex);
        var mapsMatch = url.match(mapsRegex);
        var iframe = document.createElement("iframe");
        iframe.style.border = '0';
        iframe.frameBorder = '0';
        iframe.width = '100%';
        iframe.height = '450px';
        if (youtubeMatch != null) {
            iframe.src = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        if (shortYoutubeMatch != null) {
            iframe.src = `https://www.youtube.com/embed/${shortYoutubeMatch[1]}`;
        }
        if (mapsMatch != null) {
            iframe.src = `https://www.google.com/maps/embed?pb=${mapsMatch[1]}`;
        }
        iframe.allowFullscreen = true;
        element.append(iframe);
    });
    document.getElementById("content").querySelectorAll('*').forEach(element => {
        element.classList.add("ck-content");
    });
}

window.onpopstate = function (e) {
    var pageData = pageHistory.pop();
    document.getElementById("title").innerHTML = pageData.pageTitle;
    document.getElementById("content").innerHTML = pageData.html;
    document.title = pageData.pageTitle;
};

function loadPicture(i) {
    clearTimeout(timeout);
    if (i < images.length) {
        galleryLoading.style.display = "block";
        //var ref = storage.refFromURL(images[i].url);
        //ref.getDownloadURL().then(function (url) {
        galleryImage.src = images[i].url;
        galleryImage.title = images[i].title;
        gallerySubtitle.textContent = images[i].title;
        //}).catch(function (error) {
        // TODO: Handle error
        //});
    }
}

function showNavMenu(item) {
    item.children.item(1).style.display = "block";
}

function hideNavMenu(item) {
    item.children.item(1).style.display = "none";
}

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function formatDate(date) {

    var dayIndex = date.getDay();
    var dayInMonth = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getYear();

    return "יום " + dayNames[dayIndex] + ' ' + dayInMonth + '/' + (monthIndex + 1) + '/' + (1900 + year);
}

function formatTime(time) {
    var hour = time.getHours();
    var minute = time.getMinutes();

    return hour + ':' + (minute < 10 ? '0' : '') + minute;
}