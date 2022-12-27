var db = firebase.firestore();
var auth = firebase.auth();

const notificationTable = document.getElementById("notificationTable");
const deleteDialog = document.getElementById("deleteDialog");
const editDialog = document.getElementById("editDialog");
const loadingDialog = document.getElementById("loadingDialog");

var pages = [];
var notifications = [];

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

loadNotifications();

function signOut() {
    auth.signOut();
}

function loadNotifications() {
    db.collection("notifications").orderBy("date").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var notification = doc.data();
            notification.id = doc.id;
            notification.date = doc.data().date.toDate();
            notifications.push(notification);
        });
        showNotifications();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function showNotifications() {
    document.getElementById("createButton").onclick = function () { editNotification('', '', new Date() ,notifications.length)};
    while (notificationTable.childElementCount > 1) {
        notificationTable.removeChild(notificationTable.lastChild);
    }
    for (var i = 0; i < notifications.length; i++) {
        var doc = notifications[i];
        var notification = document.createElement("tr");
        var title = document.createElement("td");
        var date = document.createElement("td");
        var actions = document.createElement("td");
        title.textContent = doc.title;
        date.textContent = formatDate(doc.date);
        var editButton = document.createElement("img");
        var deleteButton = document.createElement("img");
        editButton.src = "assets/edit-24px.svg";
        deleteButton.src = "assets/delete-24px.svg";
        editButton.onclick = onEditNotification(doc, i);
        deleteButton.onclick = onDeleteNotification(doc, i);

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        notification.appendChild(title);
        notification.appendChild(date);
        notification.appendChild(actions);

        notificationTable.appendChild(notification);
    }
}

function openDeleteDialog(doc, i) {
    deleteDialog.showModal();
    deleteDialog.getElementsByTagName("p").item(0).textContent = "האם אתה בטוח שאתה רוצה למחוק את ההודעה \"" + doc.title + "\"?";
    deleteDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { deleteDialog.close() };
    deleteDialog.getElementsByClassName("okModal").item(0).onclick = function () { deleteNotification(doc, i) };
}

function deleteNotification(doc, i) {
    deleteDialog.close();
    loadingDialog.showModal();
    db.collection("notifications").doc(doc.id).delete().then(function () {
        loadingDialog.close();
        notifications.splice(i,1);
        showNotifications();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function onEditNotification(doc, i) {
    return function () { editNotification(doc.id, doc.title, doc.date, i); };
}

function onDeleteNotification(doc, i) {
    return function () { openDeleteDialog(doc, i); };
}

function editNotification(id, title, date, i) {
    editDialog.showModal();
    editForm.title.value = title;
    editForm.date.value = formatDateInput(date);
    editDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { editDialog.close() };
    document.getElementById("editForm").onsubmit = function(e) {
        e.preventDefault();
        date.setYear(parseInt(editForm.date.value.substring(0, 4)));
        date.setMonth(parseInt(editForm.date.value.substring(5, 7)) - 1);
        date.setDate(parseInt(editForm.date.value.substring(8, 10)));
        updateNotification(id, editForm.title.value, date, i);
    };
}

function updateNotification(id, title, date, i) {
    editDialog.close();
    var notificationDocument = {
        title: title,
        date: date
    };
    loadingDialog.showModal();
    var task;
    if (id === "") {
        task = db.collection("notifications").add(notificationDocument);
    } else {
        task = db.collection("notifications").doc(id).set(notificationDocument);
    }
    task.then(function (docRef) {
        loadingDialog.close();
        if (id === "") {
            notificationDocument.id = docRef.id;
            for(var k=0; k<notifications.length; k++) {
                if(notificationDocument.date > notifications[k].date) {
                    notifications.splice(k,0,notificationDocument);
                    break;
                }
            }
        } else {
            notificationDocument.id = id;
            notifications[i] = notificationDocument;
        }
        showNotifications();
    })
        .catch(function (error) {
            console.debug(error);
            loadingDialog.close();
            //signOut();
        });
}

function formatDateInput(date) {
    var dayInMonth = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getYear();

    return (1900 + year) + '-' + (monthIndex + 1 < 10 ? '0' : '') + (monthIndex + 1) + '-' + (dayInMonth < 10 ? '0' : '') + dayInMonth;
}

function formatDate(date) {
    var dayInMonth = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getYear();

    return (dayInMonth < 10 ? '0' : '') + dayInMonth + '/' + (monthIndex + 1 < 10 ? '0' : '') + (monthIndex + 1) + '/' + (1900 + year);
}