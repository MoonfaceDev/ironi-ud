var db = firebase.firestore();
var auth = firebase.auth();

const adminTable = document.getElementById("adminTable");
const confirmationDialog = document.getElementById("confirmationDialog");
const loadingDialog = document.getElementById("loadingDialog");

admins = []

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

loadAdmins();

function signOut() {
    auth.signOut();
}

function loadAdmins() {
    db.collection("users").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var admin = doc.data();
            admin.id = doc.id;
            admins.push(admin);
        });
        showAdmins();
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function showAdmins() {
    while (adminTable.childElementCount > 1) {
        adminTable.removeChild(adminTable.lastChild);
    }
    for (var i = 0; i < admins.length; i++) {
        var doc = admins[i];
        var admin = document.createElement("tr");
        var name = document.createElement("td");
        var email = document.createElement("td");
        var actions = document.createElement("td");
        name.textContent = doc.name;
        email.textContent = doc.email;
        var acceptButton = document.createElement("img");
        var denyButton = document.createElement("img");
        var deleteButton = document.createElement("img");
        acceptButton.src = "assets/accept-24px.svg";
        denyButton.src = "assets/deny-24px.svg";
        deleteButton.src = "assets/delete-24px.svg";
        acceptButton.style.filter.color = "#4caf50";
        denyButton.style.color = "#f44336";
        acceptButton.onclick = onAcceptAdmin(doc, true, i);
        denyButton.onclick = onAcceptAdmin(doc, false, i);
        deleteButton.onclick = onDeleteAdmin(doc, i);

        if(doc.admin) {
            acceptButton.style.display = "none";
            denyButton.style.display = "none";
            deleteButton.style.display = "inline-block";
        } else {
            acceptButton.style.display = "inline-block";
            denyButton.style.display = "inline-block";
            deleteButton.style.display = "none";
        }

        actions.appendChild(acceptButton);
        actions.appendChild(denyButton);
        actions.appendChild(deleteButton);
        admin.appendChild(name);
        admin.appendChild(email);
        admin.appendChild(actions);

        adminTable.appendChild(admin);
    }
}

function onAcceptAdmin(doc, accept, i) {
    return function () { openConfirmationDialog(doc, accept, i); };
}

function onDeleteAdmin(doc, i) {
    return function () { openDeleteDialog(doc, i) };
}

function openConfirmationDialog(doc, accept, i) {
    confirmationDialog.showModal();
    confirmationDialog.getElementsByTagName("p").item(0).textContent = "האם אתה בטוח שאתה רוצה " + (accept ? "לאשר את בקשת" : "לסרב לבקשת") + " " + doc.name + "?";
    confirmationDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { confirmationDialog.close() };
    confirmationDialog.getElementsByClassName("okModal").item(0).onclick = function () { changeAdmin(doc, accept, i) };
}

function openDeleteDialog(doc, i) {
    deleteDialog.showModal();
    deleteDialog.getElementsByTagName("p").item(0).textContent = "האם אתה בטוח שאתה רוצה למחוק את " + doc.name + "?";
    deleteDialog.getElementsByClassName("cancelModal").item(0).onclick = function () { deleteDialog.close() };
    deleteDialog.getElementsByClassName("okModal").item(0).onclick = function () { deleteAdmin(doc, i) };
}

function changeAdmin(doc, accept, i) {
    confirmationDialog.close();
    loadingDialog.showModal();
    if (accept) {
        var batch = db.batch();
        batch.set(db.collection("admins").doc(doc.id), { name: doc.name, email: doc.email });
        batch.update(db.collection("users").doc(doc.id), { admin: true });
        batch.commit().then(function () {
            loadingDialog.close();
            admins[i].admin = true;
            showAdmins();
        });
    } else {
        db.collection("users").doc(doc.id).delete().then(function () {
            loadingDialog.close();
            admins.splice(i, 1);
            showAdmins();
        }).catch(function (error) {
            // TODO: Handle error
        });
    }
}

function deleteAdmin(doc, i) {
    deleteAdmin.close();
    loadingDialog.showModal();
    var batch = db.batch();
    batch.delete(db.collection("users").doc(doc.id));
    batch.delete(db.collection("admins").doc(doc.id));
    db.collection("users").doc(doc.id).delete().then(function () {
        loadingDialog.close();
        admins.splice(i, 1);
        showAdmins();
    }).catch(function (error) {
        // TODO: Handle error
    });
}