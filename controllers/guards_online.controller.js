var admin = require('../config/firebase_config.js');

module.exports = {

    get_guard_online: function (req, res) {
        var ref = admin.database().ref();
        var guards = ref.child('GuardsInformation');
        var content = '';
        guards.once('value')
            .then(function (snap) {
                Object.size = function (obj) {
                    var size = 0, key;
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) size++;
                    }
                    return size;
                };

                // Get the size of an object
                var len = Object.size(snap.val());
                console.log(len);
                res.render('guards_online_listing', {guards: snap.val(), size: len});

            });
    }

};