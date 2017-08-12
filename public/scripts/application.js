// Initialize Firebase
// Get this from firebase console
var config = {
    apiKey: "<put-your-key-here",
    authDomain: "<your-hosted-domain-here>",
    databaseURL: "<database-url>",
    projectId: "<project-id>",
    storageBucket: "<storage-bucket-here>",
    messagingSenderId: "<messaging-id-here>"
};
firebase.initializeApp(config);

// Start Google login
var provider = new firebase.auth.GoogleAuthProvider();
window.onload = function() {
    var lastClickedAt = 0;
    // grabs references to crucial elements on the index.html page
    let loginBtn = document.getElementById("login");
    let logoutBtn = document.getElementById("logout");
    let sendBtn = document.getElementById("send");
    let textBox = document.getElementById("inputBox");
    let msgBox = document.getElementById("messages");

    // listens for changes on message branch of JSON tree database. If so, prints them in the chat box.
    firebase.database().ref(`messages/`).on('child_added', (snapshot) => {
        let messageObj = snapshot.val();
        let me = '';
        // if email is === currentUser.email then display message on right.. else display left
        if (firebase.auth().currentUser.email === messageObj.email) {
            me = 'me';
        } else {
            me = 'otherUser';
        }
        // message format : Message text <BR> Sender and Date
        msgBox.innerHTML +=
            `<div class = "singleMessage ${me}">${messageObj.message}<br><b class = "fineText">${messageObj.fullname} ${messageObj.timeSent}</b></br>`;
        msgBox.scrollTop = msgBox.scrollHeight;
    });
    // if user prefers to hit enter instead of clicking the send button
    inputBox.addEventListener('keyup', function(pressed) {
        pressed.preventDefault();
        if (pressed.keyCode == 13)
            sendBtn.click();
    })
    sendBtn.onclick = function send() {
        let unixTimeId = Date.now();
        let timeSent = new Date().toLocaleString();
        let user = firebase.auth().currentUser;
        let message = textBox.value;
        // If click time is less than 5 seconds, go ahead and set to DB, user object must also be NOT null
        if (unixTimeId - lastClickedAt > 5000 && user != null) {
            firebase.database().ref(`messages/${unixTimeId}`).set({
                fullname: user.displayName,
                email: user.email,
                timeSent: timeSent,
                message: message
            });
            // clear sent message textBox, set last button click time and focus on most recent message.
            lastClickedAt = Date.now();
            textBox.focus();
            textBox.value = '';
            msgBox.scrollTop = msgBox.scrollHeight;

        } else if (unixTimeId - lastClickedAt < 5000) {
            alert('Sorry! You can only send a message every 5 seconds');
        } else {
            alert('Login error : Please sign in');
        }
    }

    logoutBtn.onclick = function logout() {
        // signs out of firebase
        firebase.auth().signOut()
            .then(function(result) {
                msgBox.style.fontSize = 0;
                loginBtn.style.display = 'inline';
                logoutBtn.style.display = 'none';
                greeting.innerHTML = `Welcome! To join the chat room, hit the login button!!!`;
                window.location.reload(true);
            })
            .catch(function(error) {
                let errorCode = error.code;
                let errorMsg = error.message;
                // Not something we want user to see
                // console.log(errorCode + "\n" + errorMsg);
            });
    }

    loginBtn.onclick = function login() {
        // popup window from Google allows account owners to sign in.
        firebase.auth().signInWithPopup(provider)
            .then(function(result) {
                var token = result.credential.accessToken;
                let user = result.user;
                // need to also hide login button and show logout button!
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'inline';
                msgBox.style.fontSize = '';
                window.location.reload(true);
                msgBox.scrollTop = msgBox.scrollHeight;
            })
            .catch(function(error) {
                let errorCode = error.code;
                let errorMsg = error.message;
                // not something we want user to see
                // console.log(errorCode + "\n" + errorMsg);
            });
    }

    firebase.auth().onAuthStateChanged(function(user) {
        // listens for a authentication state change, changes styles accordingly
        if (user) {
            msgBox.style.fontSize = '';
            textBox.disabled = false;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline';
            greeting.innerHTML = `Logged in as ${user.displayName}. Enter a message below. `;
            console.log('Logged in');
            // Unlock the input message.
        } else {
            msgBox.style.fontSize = 0;
            greeting.innerHTML = `Welcome! To join the chat room, hit the login button!!!`;
            textBox.disabled = true;
            logoutBtn.style.display = 'none';
            loginBtn.style.display = 'inline';
            console.log(`Not logged in....`);
        }
    });
}
