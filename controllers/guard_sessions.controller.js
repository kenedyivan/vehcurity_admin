let admin = require('../config/firebase_config.js');

module.exports = {

    get_guard_sessions: function (req, res) {
        let ref = admin.database().ref();
        let guards = ref.child('GuardSessions');

        let content = '';
        guards.once('value')
            .then(function (snap) {
                Object.size = function (obj) {
                    let size = 0, key;
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) size++;
                    }
                    return size;
                };

                String.prototype.trunc = String.prototype.trunc ||
                    function(n){
                        return (this.length > n) ? this.substr(0, n-1) + '...' : this;
                    };


                // Get the size of an object
                let len = Object.size(snap.val());
                console.log(len);
                console.log(snap.val());
                res.render('guard_sessions_list', {sessions: snap.val(), size: len});

            });
    }

};