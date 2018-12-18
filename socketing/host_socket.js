let admin = require('../config/firebase_config.js');
module.exports = {
    setSocket: function(io) {
        io.on('connection', function () {
            console.log('a user connected');

            let ref = admin.database().ref('Guards');
            ref.on('child_added', function (snap) {
                ref.on('value', function (guardsSnap) {
                    let data = {};
                    data.numOnline = guardsSnap.numChildren();
                    data.guard = snap.key;

                    io.emit('added', data);
                });


            });

            ref.on('child_removed', function (snap) {
                ref.on('value', function (guardsSnap) {
                    let data = {};
                    data.numOnline = guardsSnap.numChildren();
                    data.guard = snap.key;

                    io.emit('removed', data);
                });

            });
        });

        io.on('new message', function(){
           console.log('I have received a new message');
        });
    }
};