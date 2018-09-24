const authCheck = function (req, res, next) {
    //console.log("Fucing user ",req.user);
    if (req.user === undefined) {
        console.log('fuck me');
        res.redirect('/auth/login-form');
    } else {
        next();
    }


};

module.exports = authCheck;