var db = firebase.firestore();
var auth = firebase.auth();
var storage = firebase.storage();

const loadingDialog = document.getElementById("loadingDialog");
const paragraphDialog = document.getElementById("paragraphDialog");
const imageDialog = document.getElementById("imageDialog");
const videoDialog = document.getElementById("videoDialog");

const title = document.getElementById("title");
const name = document.getElementById("name");
const frame = document.getElementById("frame");

var params = new URLSearchParams(window.location.search);
title.value = params.get("title");
name.value = params.get("name");
var isNew = params.get("id") === "";

var imageSource = 0;

var html = !isNew ? params.get("html").split("<br>") : [];
loadHTML();

document.getElementById("editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    publish();
});

//ClassicEditor.defaultConfig.toolbar.items.splice(11, 4);
var editor = null;
DecoupledEditor
    .create(document.getElementById("paragraph"), { language: "he" })
    .then(function (e) {
        editor = e;
        const toolbarContainer = document.getElementById("toolbar");
        toolbarContainer.appendChild(editor.ui.view.toolbar.element);
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new MyUploadAdapter(loader);
        };
    })
    .catch(error => {
        console.error(error);
    });

auth.onAuthStateChanged(function (user) {
    if (user) {
        var displayName = user.displayName;
        var email = user.email;
        document.getElementById("name").textContent = displayName;
        document.getElementById("emailAddress").textContent = email;
        db.collection("admins").doc(user.uid).get().then(function (documentSnapshot) {
            if (documentSnapshot.exists) {
                document.getElementById("status").textContent = "סטטוס מנהל";
                document.getElementById("status").style.color = "#4caf50";
            } else {
                document.getElementById("status").textContent = "סטטוס לא מנהל";
                document.getElementById("status").style.color = "#f44336";
            }
        });
    } else {
        window.location.href = "../login.html";
    }
});

function signOut() {
    auth.signOut();
}

function loadHTML() {
    frame.innerHTML = "";
    for (var i = 0; i < html.length; i++) {
        loadElement(html[i], i);
    }
}

function loadElement(object, index) {
    var div = document.createElement("div");
    var actions = document.createElement("div");
    //var edit = document.createElement("img");
    var del = document.createElement("img");
    var down = document.createElement("img");
    var up = document.createElement("img");
    div.innerHTML = object;
    actions.classList.add("actions");
    up.src = "../assets/arrow_upward-24px.svg";
    down.src = "../assets/arrow_downward-24px.svg";
    //edit.src = "../assets/edit-24px.svg";
    del.src = "../assets/delete-24px.svg";
    up.onclick = function () { if (index > 0) { html.splice(index - 1, 0, html.splice(index, 1)[0]); loadHTML(); } };
    down.onclick = function () { if (index < html.length - 1) { html.splice(index + 1, 0, html.splice(index, 1)[0]); loadHTML(); } };
    del.onclick = function () { html.splice(index, 1); loadHTML(); }
    actions.appendChild(up);
    actions.appendChild(down);
    //actions.appendChild(edit);
    actions.appendChild(del);
    div.appendChild(actions);
    frame.appendChild(div);
}

function addParagraph() {
    editor.setData("");
    paragraphDialog.showModal();
    paragraphDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { paragraphDialog.close() };
    paragraphDialog.getElementsByClassName("okModal").item(0).onclick = function () { appendParagraph() };
}

function appendParagraph() {
    paragraphDialog.close();
    html.push(editor.getData());
    loadElement(html[html.length - 1], html.length - 1);
}

/*function addImage() {
    var image = document.getElementById("image");
    var imageButton = document.getElementById("imageButton");
    image.onclick = function () {
        imageSource = 0;
        image.classList.add("input-chosen");
        imageButton.classList.remove("input-chosen");
    }
    imageButton.onclick = function () {
        imageSource = 1;
        imageButton.classList.add("input-chosen");
        image.classList.remove("input-chosen");
    }
    imageDialog.showModal();
    imageDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { imageDialog.close() };
    imageDialog.getElementsByClassName("okModal").item(0).onclick = function () { appendImage() };
}

function appendImage() {
    imageDialog.close();
    if (imageSource == 0) {
        html.push("<img src='" + document.getElementById("image").value + "'>");
        loadElement(html[html.length - 1], html.length - 1);
    } else {
        file = document.getElementById("imageButton").files[0];
        loadingDialog.showModal();
        storage.ref().child("pages").child(new Date().getTime().toString() + "_" + file.name).put(file).then(function (snapshot) {
            snapshot.ref.getDownloadURL().then(function (url) {
                loadingDialog.close();
                html.push("<img src='" + url + "'>");
                loadElement(html[html.length - 1], html.length - 1);
            });

        });
    }
}

function addVideo() {
    videoDialog.showModal();
    videoDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { videoDialog.close() };
    videoDialog.getElementsByClassName("okModal").item(0).onclick = function () { appendVideo() };
}

function appendVideo() {
    videoDialog.close();
    var url = "https://www.youtube.com/embed/" + new URL(document.getElementById("video").value).searchParams.get("v");
    html.push("<iframe src='" + url + "'></iframe>");
    loadElement(html[html.length - 1], html.length - 1);
}*/

function publish() {
    var htmlString = html.join("<br>");
    var pageDocument = {
        name: name.value,
        title: title.value,
        html: htmlString,
        lastChangeDate: new Date()
    };
    var task = null;
    loadingDialog.showModal();
    if (isNew) {
        task = db.collection("pages").add(pageDocument);
    } else {
        task = db.collection("pages").doc(params.get("id")).set(pageDocument);
    }
    task.then(function (docRef) {
        loadingDialog.close();
        window.history.back();
    })
        .catch(function (error) {
            loadingDialog.close();
            signOut();
        });
}

class MyUploadAdapter {
    constructor(loader) {
        this.loader = loader;
    }

    upload() {
        var loader = this.loader;
        return loader.file.then(file => {
            var task = storage.ref().child("pages").child(new Date().getTime().toString() + "_" + file.name).put(file);
            return task.on('state_changed', function (snapshot) {
                console.debug(snapshot);
                loader.uploadTotal = snapshot.totalBytes;
                loader.uploaded = snapshot.bytesTransferred;
            }, function (error) {
                //TODO: Handle unsuccessful uploads
            }, function () {
                return task.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                    return task;
                });
            });
        });
    }

    abort() {
        //TODO: Abort upload
    }
}