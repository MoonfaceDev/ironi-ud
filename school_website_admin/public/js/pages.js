var db = firebase.firestore();
var auth = firebase.auth();

const pageTable = document.getElementById("pageTable");
const deleteDialog = document.getElementById("deleteDialog");
const loadingDialog = document.getElementById("loadingDialog");

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

function signOut(){
    auth.signOut();
}

function loadPages(){
    db.collection("pages").orderBy("title").get().then(function (querySnapshot) {
        querySnapshot.forEach(doc => {
            var page = document.createElement("tr");
            var title = document.createElement("td");
            var lastChangeDate = document.createElement("td");
            var actions = document.createElement("td");
            title.textContent = doc.data().title;
            lastChangeDate.textContent = formatDate(doc.data().lastChangeDate.toDate());
            var editButton = document.createElement("img");
            var deleteButton = document.createElement("img");
            editButton.src = "assets/edit-24px.svg";
            deleteButton.src = "assets/delete-24px.svg";
            editButton.onclick = function(){editPage(doc.id, doc.data().name, doc.data().title, doc.data().html)};
            deleteButton.onclick = function(){openDeleteDialog(doc, page)};
            
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
            page.appendChild(title);
            page.appendChild(lastChangeDate);
            page.appendChild(actions);

            pageTable.appendChild(page);
        });
    }).catch(function (error) {
        // TODO: Handle error
    });
}

function openDeleteDialog(doc, row) {
    deleteDialog.showModal();
    deleteDialog.getElementsByTagName("p").item(0).textContent = "האם אתה בטוח שאתה רוצה למחוק את הדף \""+doc.data().title+"\"?";
    deleteDialog.getElementsByClassName("cancelModal").item(0).onclick = function(){deleteDialog.close()};
    deleteDialog.getElementsByClassName("okModal").item(0).onclick = function(){deletePage(doc, row)};
}

function deletePage(doc, row) {
    deleteDialog.close();
    loadingDialog.showModal();
    db.collection("pages").doc(doc.id).delete().then(function() {
        loadingDialog.close();
        row.remove();
    }).catch(function(error) {
        // TODO: Handle error
    });
}

function editPage(id, name, title, html) {
    params = new URLSearchParams();
    params.append("id",id);
    params.append("name",name);
    params.append("title", title);
    sessionStorage.setItem('html', html);
    window.location.href = "pages/edit?"+params.toString();
}

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function formatDate(date) {

    var dayIndex = date.getDay();
    var dayInMonth = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getYear();

    return "יום " + dayNames[dayIndex] + ' ' + dayInMonth + '/' + (monthIndex + 1) + '/' + (1900 + year);
}