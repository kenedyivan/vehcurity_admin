var passport = require('passport');

module.exports = {

    index: function (req, res) {
        //console.log("reg ",req.flash('signupMessage')[0]);
        var message = req.flash('signupMessage')[0];
        res.render('login',{ messages: message});
    },

    processLogin: function (req, res, next) {
        passport.authenticate('local-login', {
            successRedirect: '/dashboard',
            failureRedirect: '/auth/login-form',
            failureFlash: true
        })(req, res, next);
    },

    logout:function (req, res) {
        req.logout();
        res.redirect('/auth/login-form');
    }
};