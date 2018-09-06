var express = require('express');
var router = express.Router();
var AuthController = require('../controllers/auth.controller');

/* GET admin login form. */
router.get('/login-form', function(req, res,next) {
    AuthController.index(req,res);
});

router.post('/submit-login', function(req, res,next) {
    AuthController.processLogin(req,res,next);
});

router.get('/logout', function(req, res,next) {
    AuthController.logout(req,res);
});

router.get('/fucking-login', function(req, res,next) {
    res.send("loging form");
});
module.exports = router;