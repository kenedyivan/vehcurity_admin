let admin = require('../config/firebase_config.js');
let credit = require('./owner_credit');
const log = require('../logger/logger');
const path = require('path');

const moduleName = path.basename(__filename, '.js');

module.exports = {
    processUpdateGuardCredit: function (guardSession) {
        log(moduleName, 'info', `Guard session data ${JSON.stringify(guardSession)}`);

        let $this = this;
        let guardId = guardSession.guard;
        let ownerId = guardSession.owner;

        let ownerRef = admin.database().ref('OwnersInformation');
        let owner = ownerRef.child(ownerId);
        owner.once('value', function (snap) {
            let ownerData = snap.val();
            let currentOwnerCredit = ownerData.credit;
            let totalCostOfGuarding = guardSession.totalCost;

            let ownerSpentCredit = credit.calculate_owner_spent_credit(totalCostOfGuarding);

            //Subtracts owner spent credit from owner's current credit
            let newOwnerCredit = $this.calculateNewOwnerCredit(currentOwnerCredit, ownerSpentCredit);
            let updatedOwnerCredit = {};
            updatedOwnerCredit.credit = newOwnerCredit;

            ownerRef.child(ownerId).update(updatedOwnerCredit, function (e) {
                console.log("Updated owner credit");
            });

            let guardRef = admin.database().ref('GuardsInformation');
            let guard = guardRef.child(guardId);
            guard.once('value', function (snap) {
                let guardData = snap.val();
                let currentSpentCredit = guardData.spentCredit;

                let updatedCredits = {};
                updatedCredits.spentCredit = $this.calculateNewGuardSpentCredit(currentSpentCredit, ownerSpentCredit);

                guardRef.child(guardId).update(updatedCredits, function (e) {
                    console.log("Updated guard spent credit");
                });

            });

        });

        log(moduleName, 'info', `Credits update for guard: ${guardId} and owner: ${ownerId}`);

        return "Credit payment issued";
    },
    calculateNewOwnerCredit: function (currentOwnerCredit, ownerSpentCredit) {
        return currentOwnerCredit - ownerSpentCredit;
    },

    calculateNewGuardSpentCredit: function (currentGuardSpentCredit, ownerSpentCredit) {
        return currentGuardSpentCredit + ownerSpentCredit;
    }
};