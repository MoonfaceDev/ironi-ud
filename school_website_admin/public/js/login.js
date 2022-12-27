var db = firebase.firestore();
var auth = firebase.auth();

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    login();
});

function login() {
    if (auth.currentUser) {
        auth.signOut();
    }
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var remember = document.getElementById("remember").checked;
    auth.signInWithEmailAndPassword(email, password).then(result => {
        if (!remember) {
            auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        window.location.href = "index.html";
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/invalid-email') {
            alert('כתובת אימייל זאת לא תקינה.');
        } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
            alert('כתובת אימייל או סיסמה שגויה.');
        } else {
            alert(errorMessage);
        }
    });
}