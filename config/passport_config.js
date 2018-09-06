var LocalStrategy = require('passport-local').Strategy;
var connection = require('./db_config');

connection.connect();

module.exports = function (passport) {


    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        connection.query("select * from admin where id = " + id, function (err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use('local-login',new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {

            console.log("Email: ", email);
            console.log("password: ", password);

            connection.query("SELECT * FROM admin WHERE email = '" + email + "'", function (err, rows, fields) {
                if (err) throw err;

                if (!rows.length) {
                    return done(null, false, req.flash('signupMessage','Wrong Email' ));
                } else {
                    if (!(rows[0].password === password)) {
                        console.log("wrong password");
                        return done(null, false, req.flash('signupMessage','Wrong password' ));
                    }
                    else {
                        console.log("Login successful");
                        return done(null, {id: 1, email: email, password: password});
                    }
                }

            });


            /* connection.query("SELECT * FROM `admin` WHERE `email` = '" + email + "'", function (err, rows) {
                 if (err)
                     return done(err);
                 if (!rows.length) {
                     console.log("No user found");
                     return done(null, false, {message:"No user found"});
                 }

                 // if the user is found but the password is wrong
                 if (!(rows[0].password === password)){
                     return done(null, false, {message:"Wrong password"});
                 }

                 // all is well, return successful user
                 return done(null, rows[0]);

             });*/

            /*User.findOne({ username: username }, function(err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (!user.validPassword(password)) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });*/
        }
    ));

};