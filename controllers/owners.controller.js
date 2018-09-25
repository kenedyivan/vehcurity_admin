let admin = require('../config/firebase_config.js');

module.exports = {
    get_owners: function (req, res) {
        //console.log("Returning guards");
        let ref = admin.database().ref();
        let guards = ref.child('OwnersInformation');

        let content = '';
        guards.once('value')
            .then(function (snap) {
                /*snap.forEach(function (data) {
                    let val = data.val();
                    content += val.name;
                    content += val.email;

                });
                console.log(content);*/
                Object.size = function (obj) {
                    let size = 0, key;
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) size++;
                    }
                    return size;
                };

                // Get the size of an object
                let len = Object.size(snap.val());
                console.log(len);
                res.render('owners_list', {
                        owners: snap.val(),
                        size: len,
                        messages: req.flash('info'),
                        errorMessages: req.flash('error')
                    }
                );


            });
    },

    delete_owner: function (req, res, ownerId) {
        admin.auth().deleteUser(ownerId)
            .then(function () {
                let ref = admin.database().ref('OwnersInformation');
                ref.child(ownerId).remove(function (e) {
                    console.log("Successfully deleted owner");
                    res.redirect('/owners');
                });

            })
            .catch(function (error) {
                console.log("Error deleting owner:", error);
                res.redirect('/owners');
            });
    },

    delete_owner_form: function (req, res) {
        let ownerId = req.body.owner_id;
        admin.auth().deleteUser(ownerId)
            .then(function () {
                let ref = admin.database().ref('OwnersInformation');
                ref.child(ownerId).remove(function (e) {
                    console.log("Successfully deleted owner");
                    req.flash('info', 'Owner deleted');
                    res.redirect('/owners');
                });

            })
            .catch(function (error) {
                console.log("Error deleting owner:", error);
                req.flash('error', error.message);
                res.redirect('/owners');
            });
    }
};