let admin = require('../config/firebase_config.js');
let connection = require('../config/db_config');

module.exports = {

    index: function (req, res) {
        //console.log("SocketObject ", req.app.locals.io); ///todo get the global socket io object from req.app.locals.io

        connection.query("SELECT * FROM task_logs ORDER BY created_at desc LIMIT 5 ",
            function (err, rows, fields) {
                if (err) throw err;

                Object.size = function (obj) {
                    let size = 0, key;
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) size++;
                    }
                    return size;
                };

                // Get the size of an object
                let len = Object.size(rows);
                res.render('dashboard', {tasks: rows, len: len});
            });
    }


};