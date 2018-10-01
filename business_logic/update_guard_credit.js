let admin = require('../config/firebase_config.js');
let credit = require('./guard_credit');

module.exports = {
    processUpdateGuardCredit: function (guardSession) {
        let $this = this;
        let guardId = guardSession.guard;
        //Finds guard data
        let guardRef = admin.database().ref('GuardsInformation');
        let guard = guardRef.child(guardId);
        guard.once('value', function (snap) {
            let guardData = snap.val();
            let totalCostOfGuarding = guardSession.totalCost;
            let currentGuardCredit = guardData.credit;
            let currentSpentCredit = guardData.spentCredit;

            //Calculates spent credit
            let calculatedSpentGuardCredit = credit.calculate_guard_spent_credit(totalCostOfGuarding);

            let newCurrentGuardCredit = $this.newGuardCredit(currentGuardCredit,
                calculatedSpentGuardCredit);

            let newSpentGuardCredit = $this.newSpentCredit(currentSpentCredit,
                calculatedSpentGuardCredit);

            let updatedCredits = {};
            updatedCredits.credit = newCurrentGuardCredit;
            updatedCredits.spentCredit = newSpentGuardCredit;

            guardRef.child(guardId).update(updatedCredits, function (e) {
                console.log("Credits updated")
            });

        });

        return "credits updated!";
    },

    newGuardCredit: function (currentGuardCredit, calculatedSpentGuardCredit) {
        return currentGuardCredit - calculatedSpentGuardCredit;
    },

    newSpentCredit: function (currentSpentCredit, calculatedSpentGuardCredit) {
        return currentSpentCredit + calculatedSpentGuardCredit;
    }

};