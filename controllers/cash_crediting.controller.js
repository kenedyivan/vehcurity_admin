let admin = require('../config/firebase_config.js');
let crediting = require('../business_logic/update_guard_credit');
module.exports = {
    payGuard: function (req, res) {
        let taskId = req.params.sessionId;
        let ref = admin.database().ref();
        let guardSession = ref.child('GuardSessions');

        guardSession.child(taskId).once('value')
            .then(function (snap) {
                let key = snap.key;
                let session = snap.val();

                //update guard spent credit
                let guardDetails = crediting.processUpdateGuardCredit(session);
                res.send(guardDetails);
            });
    }
};