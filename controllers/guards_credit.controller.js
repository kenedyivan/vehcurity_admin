someObject = {
    name: "kenedy akena"
};

module.exports = {
    add_guard_credit_form: function (req, res) {
        res.render('add_guard_credit');
    },

    save_guard_credit: function (req, res) {
        res.send('processing adding credit ' + someObject.name);
    }
};