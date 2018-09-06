var admin = require('../config/firebase_config.js');

module.exports = {

    get_notifications: function (req, res) {
        var ref = admin.database().ref();
        var notifications = ref.child('Notifications');

        var content = '';
        notifications.once('value')
            .then(function (snap) {
                // Get the size of an object
                var len = snap.numChildren();
                res.render('notifications', {notifications: snap.val(), size: len});

            });
    }

};