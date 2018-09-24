// Initialize Firebase
let config = {
    apiKey: "AIzaSyA15fgg0qZb1nzLUNPrzw8hgD32rd5Kp7M",
    authDomain: "vecurityapp.firebaseapp.com",
    databaseURL: "https://vecurityapp.firebaseio.com",
    projectId: "vecurityapp",
    storageBucket: "vecurityapp.appspot.com",
    messagingSenderId: "400920472071"
};
firebase.initializeApp(config);

function online(){

    return firebase.database().ref('Guards').on('value').then(function(snapshot) {
        console.log('FOnline: ',snap.val());
    });
}

online();



