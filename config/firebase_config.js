/*//var firebase = require('firebase');
var firebase = require('firebase-admin');

//FirebaseAdmin
var fire_base = firebase.initializeApp({
    serviceAccount:"../vecurityapp-f29b6ae59a04.json",
    databaseURL: "https://vecurityapp.firebaseio.com/"
});*/

let admin = require('firebase-admin');

let serviceAccount = require('../vecurityapp-f29b6ae59a04.json');

let fire_base = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://vecurityapp.firebaseio.com/'
});

module.exports = fire_base;