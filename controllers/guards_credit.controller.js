let admin = require('../config/firebase_config.js');
let business = require('../business_logic/credit');

module.exports = {
    add_guard_credit_form: function (req, res) {
        let guardId = req.params.guardId;
        let currentCredit = req.params.credit;
        res.render('add_credit_form',
            {
                guardId: guardId,
                currentCredit: currentCredit
            });
    },

    save_guard_credit: function (req, res) {
        let uid = req.body.guardId;
        let currentCredit = req.body.currentCredit;
        let amount = req.body.amount;

        //Calculate credit
        let actualCredit = business.calculate_credit(currentCredit,amount);

        let creditData = {
            credit: actualCredit
        };


        let ref = admin.database().ref('GuardsInformation');
        ref.child(uid).update(creditData, function (e) {
            req.flash('info', 'Guard credit updated');
            res.redirect('/guards');
        }).catch(function (error) {
            console.log("Error updating user:", error);
            req.flash('error', error.message);
            res.redirect('/credit/' + uid + '/add');
        });

    }
};