var db = firebase.firestore();
var auth = firebase.auth();
var storage = firebase.storage();

const imageTable = document.getElementById("imageTable");
const deleteDialog = document.getElementById("deleteDialog");
const editDialog = document.getElementById("editDialog");
const viewDialog = document.getElementById("viewDialog");
const loadingDialog = document.getElementById("loadingDialog");

var images = [];

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
        window.location.href = "login.html";
    }
});

loadImages();

function signOut() {
    auth.signOut();
}

function loadImages() {
    db.collection("gallery").orderBy("order").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var img = doc.data();
            img.id = doc.id;
            images.push(img);
        });
        showImages();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function showImages() {
    document.getElementById("createButton").onclick = function () { editImage(images.length > 0 ? images[images.length - 1].order + 1 : 0) };
    while (imageTable.childElementCount > 1) {
        imageTable.removeChild(imageTable.lastChild);
    }
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var image = document.createElement("tr");
        var title = document.createElement("td");
        var createdDate = document.createElement("td");
        var actions = document.createElement("td");
        title.textContent = img.title;
        createdDate.textContent = formatDate(img.date.toDate());
        var viewButton = document.createElement("img");
        var upButton = document.createElement("img");
        var downButton = document.createElement("img");
        var deleteButton = document.createElement("img");
        viewButton.src = "assets/image-24px.svg";
        upButton.src = "assets/arrow_upward-24px.svg";
        downButton.src = "assets/arrow_downward-24px.svg";
        deleteButton.src = "assets/delete-24px.svg";
        viewButton.onclick = onViewImage(img, i)
        upButton.onclick = onUpImage(i);
        downButton.onclick = onDownImage(i);
        deleteButton.onclick = onDeleteImage(img, i);

        actions.appendChild(viewButton);
        actions.appendChild(upButton);
        actions.appendChild(downButton);
        actions.appendChild(deleteButton);
        image.appendChild(title);
        image.appendChild(createdDate);
        image.appendChild(actions);

        imageTable.appendChild(image);
    }
}

function openDeleteDialog(img, i) {
    deleteDialog.showModal();
    deleteDialog.getElementsByTagName("p").item(0).textContent = "האם אתה בטוח שאתה רוצה למחוק את התמונה \"" + img.title + "\"?";
    deleteDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { deleteDialog.close() };
    deleteDialog.getElementsByClassName("okModal").item(0).onclick = function () { deleteImage(img, i) };
}

function onViewImage(img, i) {
    return function () {
        var titleView = document.getElementById("titleView");
        var imageView = document.getElementById("imageView");
        titleView.value = img.title;
        loadingDialog.showModal();
        imageView.src = img.url;
        viewDialog.showModal();
        loadingDialog.close();
        viewDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { viewDialog.close() };
        document.getElementById("viewForm").onsubmit = function (e) {
            e.preventDefault();
            viewDialog.close();
            loadingDialog.showModal();
            updateTitle(img.id, titleView.value, i);
        };
    };
}

function onUpImage(index) {
    var img = images[index];
    return function () {
        if (index > 0) {
            if (index > 1) {
                order = (images[index - 1].order + images[index - 2].order) / 2;
            } else {
                order = images[index - 1].order - 1;
            }
            img.order = order;
            updateItemOrder(img.id, order, index);
            images.splice(index - 1, 0, images.splice(index, 1)[0]);
            showImages();
        }
    };
}

function onDownImage(index) {
    var img = images[index];
    return function () {
        if (index < images.length - 1) {
            if (index < images.length - 2) {
                order = (images[index + 1].order + images[index + 2].order) / 2;
            } else {
                order = images[index + 1].order + 1;
            }
            img.order = order;
            updateItemOrder(img.id, order);
            images.splice(index + 1, 0, images.splice(index, 1)[0]);
            showImages();
        }
    };
}

function onDeleteImage(img, i) {
    return function () { openDeleteDialog(img, i); };
}

function editImage(order) {
    var title = document.getElementById("title");
    var imageButton = document.getElementById("imageButton");
    var title_value = title.value;
    title.value = "";
    imageButton.value = "";
    editDialog.showModal();
    editDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { editDialog.close() };
    document.getElementById("editForm").onsubmit = function (e) {
        e.preventDefault();
        editDialog.close();
        files = imageButton.files;
        loadingDialog.showModal();
        galleryRef = storage.ref().child("gallery");
        /*compressedFiles = [];
        for (var i = 0; i < files.length; i++) {
            compressedFiles.push(compress(files[i]));
        };
        Promise.all(compressedFiles).then(function (files) {*/
        uploads = [];
        for (var i = 0; i < files.length; i++) {
            uploads.push(galleryRef.child(new Date().getTime().toString() + "_" + files[i].name).put(files[i]));
        };
        Promise.all(uploads).then(function (snapshots) {
            loadingDialog.close();
            snapshots.forEach(snapshot => {
                snapshot.ref.getDownloadURL().then(function(url) {
                    updateImage(title_value, url, order);
                });
            });
        });
        //});
    };
}

/*async function compress(f) {
    const width = 740*2;
    const height = 300*2;
    const fileName = f.name;
    const reader = new FileReader();
    reader.readAsDataURL(f);
    return new Promise((resolve, reject) => {
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            resolve(new Promise((resolve, reject) => {
                img.onload = () => {
                    const elem = document.createElement('canvas');
                    var img_width = img.width;
                    var img_height = img.height;
                    if (img_width / img_height > width / height) {
                        img_height = width * (img_height / img_width);
                        img_width = width;
                    } else {
                        img_width = height * (img_width / img_height);
                        img_height = height;
                    }
                    elem.width = img_width;
                    elem.height = img_height;
                    elem.getContext('2d').drawImage(img, 0, 0, img_width, img_height);
                    resolve(new Promise((resolve, reject) => {
                        elem.toBlob((blob) => {
                            const file = new File([blob], fileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(file);
                        }, 'image/jpeg', 1);
                    }));
                };
            }));
        };
    });
}*/

function updateItemOrder(id, order) {
    loadingDialog.showModal();
    db.collection("gallery").doc(id).update({ order: order }).then(function () {
        loadingDialog.close();
    });
}

function deleteImage(img, i) {
    deleteDialog.close();
    loadingDialog.showModal();
    db.collection("gallery").doc(img.id).delete().then(function () {
        loadingDialog.close();
        images.splice(i, 1);
        showImages();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function updateImage(title, url, order) {
    var imageDocument = {
        title: title,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        url: url,
        order: order
    };
    db.collection("gallery").add(imageDocument).then(function (docRef) {
        loadingDialog.close();
        imageDocument.id = docRef.id;
        imageDocument.date = new firebase.firestore.Timestamp(new Date().getTime() / 1000, 0);
        images.push(imageDocument);
        showImages();
    })
        .catch(function (error) {
            console.debug(error);
            loadingDialog.close();
            signOut();
        });
}

function updateTitle(id, title, i) {
    db.collection("gallery").doc(id).update({ title: title }).then(function (docRef) {
        loadingDialog.close();
        images[i].title = title;
        showImages();
    })
        .catch(function (error) {
            console.debug(error);
            loadingDialog.close();
            signOut();
        });
}

function formatDate(date) {
    var dayInMonth = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getYear();

    return (dayInMonth < 10 ? '0' : '') + dayInMonth + '/' + (monthIndex + 1 < 10 ? '0' : '') + (monthIndex + 1) + '/' + (1900 + year);
}