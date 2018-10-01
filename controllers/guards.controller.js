let admin = require('../config/firebase_config.js');
const INITIAL_GUARD_CREDIT = 14;

module.exports = {
    get_guards: function (req, res) {
        //console.log("Returning guards");
        let ref = admin.database().ref();
        let guards = ref.child('GuardsInformation');

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
                res.render('guards_list',
                    {
                        guards: snap.val(),
                        size: len,
                        messages: req.flash('info'),
                        errorMessages: req.flash('error')
                    });


            });

    },

    delete_guard: function (req, res, guardId) {
        admin.auth().deleteUser(guardId)
            .then(function () {
                let ref = admin.database().ref('GuardsInformation');
                ref.child(guardId).remove(function (e) {
                    console.log("Successfully deleted guard");
                    req.flash('info', 'Guard deleted');
                    res.redirect('/guards');
                });

            })
            .catch(function (error) {
                console.log("Error deleting guard:", error);
                req.flash('error', error.message);
                res.redirect('/guards');
            });
    },

    delete_guard_form: function (req, res) {
        let guardId = req.body.guard_id;
        admin.auth().deleteUser(guardId)
            .then(function () {
                let ref = admin.database().ref('GuardsInformation');
                ref.child(guardId).remove(function (e) {
                    console.log("Successfully deleted guard");
                    req.flash('info', 'Guard deleted');
                    res.redirect('/guards');
                });

            })
            .catch(function (error) {
                console.log("Error deleting guard:", error);
                req.flash('error', error.message);
                res.redirect('/guards');
            });
    },

    edit_guard: function (req, res, guardId) {
        let guardData;
        let ref = admin.database().ref('GuardsInformation');
        let guard = ref.child(guardId);
        guard.on('value', function (snap) {
            console.log(snap.val());
            guardData = snap.val();
            res.render('edit_guard', {
                guard: snap.val(),
                id: guardId,
                messages: req.flash('info'),
                errorMessages: req.flash('error')
            });
        });

    },

    update: function (req, res) {
        let uid = req.body.id;
        let fullName = req.body.full_name;
        let email = req.body.email;
        let phone = req.body.phone;
        let newPassword = req.body.confirm_password;

        let authDataUpdate = {};
        let dbDataUpdate = {};

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
                let ref = admin.database().ref('GuardsInformation');
                ref.child(uid).update(dbDataUpdate, function (e) {
                    console.log("Successfully updated user", userRecord.toJSON());
                    req.flash('info', 'Guard details updated');
                    res.redirect('/guards');
                });

            })
            .catch(function (error) {
                console.log("Error updating user:", error);
                req.flash('error', error.message);
                res.redirect('/guards/' + uid + '/edit');
            });

    },

    create_guard: function (req, res) {
        res.render('create_guard', {
            messages: req.flash('info'),
            errorMessages: req.flash('error')
        });
    },

    save_guard: function (req, res) {
        let fullName = req.body.full_name;
        let email = req.body.email;
        let phone = req.body.phone;
        let password = req.body.confirm_password;

        admin.auth().createUser({
            email: email,
            phoneNumber: phone,
            password: password,
            displayName: fullName
        })
            .then(function (userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log("Successfully created new user:", userRecord.uid);
                let ref = admin.database().ref('GuardsInformation');
                ref.child(userRecord.uid).set({
                    avatar: 'none',
                    name: fullName,
                    email: email,
                    phone: phone,
                    password: password,
                    credit: INITIAL_GUARD_CREDIT,
                    spentCredit: 0,
                    commission: 0
                }, function (a) {
                    req.flash('info', 'Guard created');
                    res.redirect('/guards');
                });
            })
            .catch(function (error) {
                console.log("Error creating new user:", error.message);
                req.flash('error', error.message);
                res.redirect('/guards/create');
            });
    }
};