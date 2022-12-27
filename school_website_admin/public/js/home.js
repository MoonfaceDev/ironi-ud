var db = firebase.firestore();
var auth = firebase.auth();

const itemTable = document.getElementById("itemTable");
const deleteDialog = document.getElementById("deleteDialog");
const editDialog = document.getElementById("editDialog");
const listDialog = document.getElementById("listDialog");
const loadingDialog = document.getElementById("loadingDialog");

var pages = [];
var items = [];

auth.onAuthStateChanged(function (user) {
    if (user) {
        var displayName = user.displayName;
        var email = user.email;
        document.getElementById("name").textContent = displayName;
        document.getElementById("emailAddress").textContent = email;
        db.collection("admins").doc(user.uid).get().then(function(documentSnapshot) {
            if(documentSnapshot.exists){
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

loadPages();
loadItems();

function signOut() {
    auth.signOut();
}

function loadPages() {
    var pageInput = document.getElementById("page");
    var listPageInput = document.getElementById("listPage");
    db.collection("pages").orderBy("title").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var option;
            var page = doc.data();
            page.id = doc.id;
            pages.push(page);
            option = document.createElement("option");
            option.value = page.id;
            option.textContent = page.title;
            pageInput.appendChild(option);
            option = document.createElement("option");
            option.value = page.id;
            option.textContent = page.title;
            listPageInput.appendChild(option);
        });
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function loadItems() {
    db.collection("menu").orderBy("order").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var item = doc.data();
            item.id = doc.id;
            items.push(item);
        });
        showItems();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function showItems() {
    document.getElementById("createButton").onclick = function () { editItem('', '', 'single', '', '', [], items.length, items[items.length - 1].order + 1) };
    while (itemTable.childElementCount > 1) {
        itemTable.removeChild(itemTable.lastChild);
    }
    for (var i = 0; i < items.length; i++) {
        var doc = items[i];
        var item = document.createElement("tr");
        var title = document.createElement("td");
        var type = document.createElement("td");
        var actions = document.createElement("td");
        title.textContent = doc.title;
        switch (doc.type) {
            case "none":
                type.textContent = "רשימה בלבד";
                break;
            case "single":
                type.textContent = "דף יחיד";
                break;
            case "link":
                type.textContent = "קישור";
                break;
        }
        var editButton = document.createElement("img");
        var upButton = document.createElement("img");
        var downButton = document.createElement("img");
        var deleteButton = document.createElement("img");
        editButton.src = "assets/edit-24px.svg";
        upButton.src = "assets/arrow_upward-24px.svg";
        downButton.src = "assets/arrow_downward-24px.svg";
        deleteButton.src = "assets/delete-24px.svg";
        editButton.onclick = onEditItem(doc, i);
        upButton.onclick = onUpItem(i);
        downButton.onclick = onDownItem(i);
        deleteButton.onclick = onDeleteItem(doc, i);

        actions.appendChild(editButton);
        actions.appendChild(upButton);
        actions.appendChild(downButton);
        actions.appendChild(deleteButton);
        item.appendChild(title);
        item.appendChild(type);
        item.appendChild(actions);

        itemTable.appendChild(item);
    }
}

function openDeleteDialog(doc, i) {
    deleteDialog.showModal();
    deleteDialog.getElementsByTagName("p").item(0).textContent = "האם אתה בטוח שאתה רוצה למחוק את הפריט \"" + doc.title + "\"?";
    deleteDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { deleteDialog.close() };
    deleteDialog.getElementsByClassName("okModal").item(0).onclick = function () { deleteItem(doc, i) };
}

function deleteItem(doc, i) {
    deleteDialog.close();
    loadingDialog.showModal();
    db.collection("menu").doc(doc.id).delete().then(function () {
        loadingDialog.close();
        items.splice(i,1);
        showItems();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function onEditItem(doc, i) {
    return function () { editItem(doc.id, doc.title, doc.type, doc.pageID, doc.link, doc.list, i, doc.order); };
}

function onUpItem(index) {
    var doc = items[index];
    return function () {
        if (index > 0) {
            if (index > 1) {
                order = (items[index - 1].order + items[index - 2].order) / 2;
            } else {
                order = items[index - 1].order - 1;
            }
            updateItemOrder(doc.id, order);
            items[index].order = order;
            items.splice(index - 1, 0, items.splice(index, 1)[0]);
            showItems();
        }
    };
}

function onDownItem(index) {
    var doc = items[index];
    return function () {
        if (index < items.length - 1) {
            if (index < items.length - 2) {
                order = (items[index + 1].order + items[index + 2].order) / 2;
            } else {
                order = items[index + 1].order + 1;
            }
            updateItemOrder(doc.id, order);
            items[index].order = order;
            items.splice(index + 1, 0, items.splice(index, 1)[0]);
            showItems();
        }
    };
}

function onDeleteItem(doc, i) {
    return function () { openDeleteDialog(doc, i); };
}

function updateItemOrder(id, order) {
    loadingDialog.showModal();
    db.collection("menu").doc(id).update({ order: order }).then(function () {
        loadingDialog.close();
    });
}

function editItem(id, title, type, pageID, link, list, i, order) {
    editDialog.showModal();
    var titleInput = document.getElementById("title");
    titleInput.value = title;
    var pageInput = document.getElementById("page");
    pageInput.value = pageID;
    var linkInput = document.getElementById("link");
    linkInput.value = link;
    var listTable = document.getElementById("listTable");
    document.getElementById("addList").onclick = function () { editListItem('', 'single', '', '', list, listTable, -1) };
    loadListItems(list, listTable);
    var typeInput = document.getElementById("type");
    typeInput.value = type;
    typeInput.onchange = function () {
        switch (typeInput.value) {
            case "single":
                pageInput.style.display = "inline-block";
                linkInput.style.display = "none";
                pageInput.required = true;
                linkInput.required = false;
                break;
            case "link":
                pageInput.style.display = "none";
                linkInput.style.display = "inline-block";
                pageInput.required = false;
                linkInput.required = true;
                break;
            case "none":
                pageInput.style.display = "none";
                linkInput.style.display = "none";
                pageInput.required = false;
                linkInput.required = false;
                break;
        }
    }
    typeInput.onchange();
    editDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { editDialog.close() };
    document.getElementById("editForm").onsubmit = function(e) {
        e.preventDefault();
        updateItem(id, titleInput.value, typeInput.value, pageInput.value, linkInput.value, list, i, order);
    };
}

function getLinkFromPageID(pageID) {
    var link;
    pages.forEach(page => {
        if (page.id === pageID) {
            link = page.name;
        }
    });
    return link;
}

function updateItem(id, title, type, pageID, link, list, i, order) {
    editDialog.close();
    if (type === "single") {
        link = getLinkFromPageID(pageID);
    }
    var itemDocument = {
        title: title,
        type: type,
        pageID: pageID,
        link: link,
        list: list,
        order: order
    };
    loadingDialog.showModal();
    var task;
    if (id === "") {
        task = db.collection("menu").add(itemDocument);
    } else {
        task = db.collection("menu").doc(id).set(itemDocument);
    }
    task.then(function (docRef) {
        loadingDialog.close();
        if (id === "") {
            itemDocument.id = docRef.id;
            items.push(itemDocument);
        } else {
            itemDocument.id = id;
            items[i] = itemDocument;
        }
        showItems();
    })
        .catch(function (error) {
            loadingDialog.close();
            signOut();
        });
}

function loadListItems(list, listTable) {
    while (listTable.childElementCount > 1) {
        listTable.removeChild(listTable.lastChild);
    }
    for (var i = 0; i < list.length; i++) {
        var listItem = list[i];
        var listItemRow = document.createElement("tr");
        var listItemTitle = document.createElement("td");
        var listItemActions = document.createElement("td");
        listItemTitle.textContent = listItem.title;
        var editButton = document.createElement("img");
        var downButton = document.createElement("img");
        var upButton = document.createElement("img");
        var deleteButton = document.createElement("img");
        editButton.src = "assets/edit-24px.svg";
        upButton.src = "../assets/arrow_upward-24px.svg";
        downButton.src = "../assets/arrow_downward-24px.svg";
        deleteButton.src = "assets/delete-24px.svg";
        editButton.onclick = buildListOnEdit(i, listItem, list, listTable);
        upButton.onclick = buildListOnUp(i, list, listTable);
        downButton.onclick = buildListOnDown(i, list, listTable);
        deleteButton.onclick = buildListOnDelete(i, list, listTable);

        listItemActions.appendChild(editButton);
        listItemActions.appendChild(upButton);
        listItemActions.appendChild(downButton);
        listItemActions.appendChild(deleteButton);

        listItemRow.appendChild(listItemTitle);
        listItemRow.appendChild(listItemActions);

        listTable.appendChild(listItemRow);
    }
}

function buildListOnEdit(i, listItem, list, listTable) {
    return function () {
        editListItem(listItem.title, listItem.type, listItem.pageID, listItem.link, list, listTable, i)
    };
}

function buildListOnUp(i, list, listTable) {
    return function () {
        if (i > 0) {
            list.splice(i - 1, 0, list.splice(i, 1)[0]);
            loadListItems(list, listTable);
        }
    };
}

function buildListOnDown(i, list, listTable) {
    return function () {
        if (i < list.length - 1) {
            list.splice(i + 1, 0, list.splice(i, 1)[0]);
            loadListItems(list, listTable);
        }
    };
}

function buildListOnDelete(i, list, listTable) {
    return function () {
        list.splice(i, 1);
        loadListItems(list, listTable);
    };
}

function editListItem(title, type, pageID, link, list, listTable, index) {
    listDialog.showModal();
    var titleInput = document.getElementById("listTitle");
    titleInput.value = title;
    var pageInput = document.getElementById("listPage");
    pageInput.value = pageID;
    var linkInput = document.getElementById("listLink");
    linkInput.value = link;
    var typeInput = document.getElementById("listType");
    typeInput.value = type;
    typeInput.onchange = function () {
        switch (typeInput.value) {
            case "single":
                pageInput.style.display = "inline-block";
                linkInput.style.display = "none";
                pageInput.required = true;
                linkInput.required = false;
                break;
            case "link":
                pageInput.style.display = "none";
                linkInput.style.display = "inline-block";
                pageInput.required = false;
                linkInput.required = true;
                break;
        }
    }
    typeInput.onchange();
    listDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { listDialog.close() };
    document.getElementById("listForm").onsubmit = function(e) {
        e.preventDefault();
        title = titleInput.value;
        type = typeInput.value;
        pageID = pageInput.value;
        link = linkInput.value;
        updateListItem(title, type, pageID, link, list, listTable, index);
    };
}

function updateListItem(title, type, pageID, link, list, listTable, index) {
    listDialog.close();
    if (type === "single") {
        link = getLinkFromPageID(pageID);
    }
    var listItem = {
        title: title,
        type: type,
        pageID: pageID,
        link: link
    };
    if (index == -1) {
        list.push(listItem);
    } else {
        list[index] = listItem;
    }
    loadListItems(list, listTable);
}