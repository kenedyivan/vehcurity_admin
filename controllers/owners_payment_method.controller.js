var connection = require('../config/db_config');

module.exports = {

    save_visa_details: function (req, res) {
        res.send(this.save_to_db(req));

    },

    save_to_db: function (req) {
        var userId = req.params.userId;
        var cardNumber = req.params.cardNumber;
        var month = req.params.month;
        var year = req.params.year;
        var cvv = req.params.cvv;
        var cardName = req.params.cardName;
        var address = req.params.address;
        var phone = req.params.phone;
        connection.query("INSERT INTO owner_visa_details(user_id,card_number,month,year,cvv,card_name,address,phone) " +
            "VALUES('" + userId + "','" + cardNumber + "','" + month + "','" + year + "','" + cvv + "','" + cardName + "','" + address + "','" + phone + "')",
            function (err, rows, fields) {
                if (err) throw err;
                return rows;

            });
        connection.end();
    },

    get_owner_visa_methods: function (req, res) {
        connection.query('select * from owner_visa_details where user_id = \'cyrsQIZlaTc87FL63nFRTC2cos52\'', function (err, rows, fields) {
            if (err) throw err

            //res.send(rows);
        })

    }

};
