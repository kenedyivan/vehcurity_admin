var admin = require('../config/firebase_config.js');

module.exports = {

    get_guard_requests: function (req, res) {
        var ref = admin.database().ref();
        var guards = ref.child('Requests');

        var content = '';
        guards.once('value')
            .then(function (snap) {
                // Get the size of an object
                var len = snap.numChildren();
                res.render('guard_requests_list', {requests: snap.val(), size: len});

            });
    },

    delete_all_requests: function(req, res){
        var ref = admin.database().ref();
        ref.child('Requests').remove();
        res.send({message:'Delete requests'});
    }

};