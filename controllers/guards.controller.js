var admin = require('../config/firebase_config.js');

module.exports = {
    get_guards: function (req, res) {
        //console.log("Returning guards");
        var ref = admin.database().ref();
        var guards = ref.child('GuardsInformation');

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
                res.render('guards_list', {guards: snap.val(), size: len});


            });

    },

    delete_guard: function (req, res, guardId) {
        admin.auth().deleteUser(guardId)
            .then(function () {
                var ref = admin.database().ref('GuardsInformation');
                ref.child(guardId).remove(function (e) {
                    console.log("Successfully deleted guard");
                    res.redirect('/guards');
                });

            })
            .catch(function (error) {
                console.log("Error deleting guard:", error);
                res.redirect('/guards');
            });
    },

    edit_guard: function (req, res, guardId) {
        var ref = admin.database().ref('GuardsInformation');
        var guard = ref.child(guardId);
        guard.on('value', function (snap) {
            console.log(snap.val());
            res.render('edit_guard', {guard: snap.val(), id: guardId});
        });
    },

    update: function (req, res) {
        var uid = req.body.id;
        var fullName = req.body.full_name;
        var email = req.body.email;
        var phone = req.body.phone;
        var newPassword = req.body.confirm_password;

        var authDataUpdate = {};
        var dbDataUpdate = {};

        if (fullName != null && fullName !== "") {
            authDataUpdate.displayName = fullName;
            dbDataUpdate.name = fullName;
        }


        if (email != null && email !== "") {
            authDataUpdate.email = email;
            dbDataUpdate.email = email;
            authDataUpdate.emailVerified = true;
        }

        if (phone != null && phone !== "") {
            authDataUpdate.phoneNumber = phone;
            dbDataUpdate.phone = phone;
        }


        if (newPassword != null && newPassword !== "") {
            authDataUpdate.password = newPassword;
            dbDataUpdate.password = newPassword;
        }

        admin.auth().updateUser(uid, authDataUpdate)
            .then(function (userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                var ref = admin.database().ref('GuardsInformation');
                ref.child(uid).update(dbDataUpdate, function (e) {
                    console.log("Successfully updated user", userRecord.toJSON());
                    res.redirect('/guards');
                });

            })
            .catch(function (error) {
                console.log("Error updating user:", error);
                res.redirect('/guards/' + uid + '/edit');
            });

    },

    create_guard: function (req, res) {
        res.render('create_guard');
    },

    save_guard: function (req, res) {
        var fullName = req.body.full_name;
        var email = req.body.email;
        var phone = req.body.phone;
        var password = req.body.confirm_password;

        admin.auth().createUser({
            email: email,
            phoneNumber: phone,
            password: password,
            displayName: fullName
        })
            .then(function (userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log("Successfully created new user:", userRecord.uid);
                var ref = admin.database().ref('GuardsInformation');
                ref.child(userRecord.uid).set({
                    name: fullName,
                    email: email,
                    phone: phone,
                    password: password
                }, function (a) {
                    res.redirect('/guards');
                });
            })
            .catch(function (error) {
                console.log("Error creating new user:", error);
                res.redirect('/create');
            });
    }
};