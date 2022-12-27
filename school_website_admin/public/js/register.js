var db = firebase.firestore();
var auth = firebase.auth();

const registerForm = document.getElementById("registerForm");
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    register();
});

function register() {
    var name = document.getElementById("name").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;
    if (password === confirmPassword) {
        auth.createUserWithEmailAndPassword(email, password).then(result => {
            result.user.updateProfile({displayName: name}).then(function() {
                db.collection("users").doc(result.user.uid).set({
                    name: name, email: email, admin: false
                }).then(function(result) {
                    window.location.href = "index.html";
                });
            });
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode === 'auth/invalid-email') {
                alert('כתובת אימייל זאת לא תקינה.');
            } else if (errorCode === 'auth/email-already-in-use') {
                alert('כתובת אימייל זאת נמצאת בשימוש.');
            } else if (errorCode === 'auth/weak-password') {
                alert('הסיסמה חלשה מדי.');
            }
            else {
                alert(errorMessage);
            }
        });
    } else {
        document.getElementById("confirmPassword").setCustomValidity('הסיסמאות לא תואמות.');
    }
}