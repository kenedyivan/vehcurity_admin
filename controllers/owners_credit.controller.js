let admin = require('../config/firebase_config.js');
let business = require('../business_logic/owner_credit');

module.exports = {
    add_owner_credit_form: function (req, res) {
        let ownerId = req.params.ownerId;
        let currentCredit = req.params.credit;
        res.render('add_owner_credit_form',
            {
                ownerId: ownerId,
                currentCredit: currentCredit
            });
    },

    save_owner_credit: function (req, res) {
        let uid = req.body.ownerId;
        let currentCredit = req.body.currentCredit;
        let amount = req.body.amount;

        //Calculate credit
        let actualCredit = business.calculate_credit(currentCredit, amount);
        console.log(actualCredit);

        let creditData = {
            credit: actualCredit
        };

        let ref = admin.database().ref('OwnersInformation');
        ref.child(uid).update(creditData, function (e) {
            req.flash('info', 'owner credit updated');
            res.redirect('/owners');
        }).catch(function (error) {
            console.log("Error updating user:", error);
            req.flash('error', error.message);
            res.redirect('/owner/credit/' + uid + '/add');
        });

    }
};