//import TableToolbar from "/@ckeditor/ckeditor5-table/src/tabletoolbar.js";
// const TableProperties = import("/@ckeditor/ckeditor5-table/src/tableproperties.js");
// const TableCellProperties = import("/@ckeditor/ckeditor5-table/src/tablecellproperties.js");

var db = firebase.firestore();
var auth = firebase.auth();
var storage = firebase.storage();

const loadingDialog = document.getElementById("loadingDialog");

const title = document.getElementById("title");
const name = document.getElementById("name");

var params = new URLSearchParams(window.location.search);
title.value = params.get("title");
name.value = params.get("name");
var isNew = params.get("id") === "";
var html = sessionStorage.getItem("html");

document.getElementById("editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    publish();
});

var editor = null;
DecoupledDocumentEditor
    .create(document.getElementById("paragraph"), {
        toolbar: {
            items: [
                'heading',
                '|',
                'fontSize',
                'fontFamily',
                '|',
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'highlight',
                '|',
                'alignment',
                '|',
                'numberedList',
                'bulletedList',
                '|',
                'indent',
                'outdent',
                '|',
                'todoList',
                'link',
                'blockQuote',
                'imageUpload',
                'insertTable',
                'mediaEmbed',
                '|',
                'undo',
                'redo'
            ]
        },
        language: 'he',
        image: {
            toolbar: [
                'imageTextAlternative',
                'imageStyle:full',
                'imageStyle:side'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells',
                'tableCellProperties',
                'tableProperties'
            ]
        },
        mediaEmbed: {
            extraProviders: [
                {
                    name: "googleMaps",
                    url: /\<iframe src\=\"https\:\/\/www\.google\.com\/maps\/embed\?pb\=([a-z|A-Z|0-9|!|\.|\%]+)\" width\=\"600\" height\=\"450\" frameborder\=\"0\" style\=\"border\:0\;\" allowfullscreen\=\"\" aria-hidden=\"false\" tabindex\=\"0\"\>\<\/iframe\>/,
                    html: match =>
                        `<iframe width="100%" height="450" frameborder="0" style="border:0" src="https://www.google.com/maps/embed?pb=${match[1]}" width="600" height="450" frameborder="0" style="border:0;" allowfullscreen="" aria-hidden="false" tabindex="0"></iframe>`
                }
            ]
        },
        link: {
            decorators: {
                openInNewTab: {
                    mode: 'manual',
                    label: 'פתח בכרטיסייה חדשה',
                    defaultValue: true,
                    attributes: {
                        target: '_blank',
                        rel: 'noopener noreferrer'
                    }
                }
            }
        }
    })
    .then(function (e) {
        editor = e;
        toolbar = document.getElementById("toolbar").appendChild(editor.ui.view.toolbar.element);
        toolbar.style.border = "none";
        toolbar.style.background = "none";
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new MyUploadAdapter(loader);
        };
        editor.setData(html);
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

function publish() {
    var pageDocument = {
        name: name.value,
        title: title.value,
        html: editor.getData(),
        lastChangeDate: new Date()
    };
    var task = null;
    loadingDialog.showModal();
    if (isNew) {
        task = db.collection("pages").add(pageDocument);
    } else {
        task = db.collection("pages").doc(params.get("id")).set(pageDocument);
    }
    task.then(function () {
        loadingDialog.close();
        window.history.back();
    })
        .catch(function () {
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
        return loader.file.then(file => new Promise((resolve) => {
            var task = storage.ref().child("pages").child(new Date().getTime().toString() + "_" + file.name).put(file);
            return task.on('state_changed', function (snapshot) {
                console.debug(snapshot);
                loader.uploadTotal = snapshot.totalBytes;
                loader.uploaded = snapshot.bytesTransferred;
            }, function () {
                //TODO: Handle unsuccessful uploads
            }, function () {
                return task.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                    resolve({
                        default: downloadURL
                    });
                });
            });
        }));
    }

    abort() {
        //TODO: Abort upload
    }
}