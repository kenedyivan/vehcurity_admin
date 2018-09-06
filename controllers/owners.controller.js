var admin = require('../config/firebase_config.js');

module.exports = {
    get_owners: function (req, res) {
        //console.log("Returning guards");
        var ref = admin.database().ref();
        var guards = ref.child('OwnersInformation');

        var content = '';
        guards.once('value')
            .then(function (snap) {
                /*snap.forEach(function (data) {
                    var val = data.val();
                    content += val.name;
                    content += val.email;

                });
                console.log(content);*/
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
                res.render('owners_list', {owners: snap.val(), size: len});


            });
    },

    delete_owner: function (req, res, ownerId) {
        admin.auth().deleteUser(ownerId)
            .then(function () {
                var ref = admin.database().ref('OwnersInformation');
                ref.child(ownerId).remove(function (e) {
                    console.log("Successfully deleted owner");
                    res.redirect('/owners');
                });

            })
            .catch(function (error) {
                console.log("Error deleting owner:", error);
                res.redirect('/owners');
            });
    }
};