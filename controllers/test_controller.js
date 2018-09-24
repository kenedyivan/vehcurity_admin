//counter = 0;

module.exports = {

    counter:0,

    addData: function (req, res) {

        this.counter++;

        res.send("Added "+ this.counter);
    },

    subData: function (req, res) {

        this.counter--;

        res.send("Subed "+ this.counter);
    },


    getData: function (req, res) {
        res.send("Counter state "+ this.counter);
    }

};