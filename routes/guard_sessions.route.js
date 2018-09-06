var express = require('express');
var router = express.Router();
var GuardSessionsController = require('../controllers/guard_sessions.controller');

/* GET guard sessions listing. */
router.get('/', function(req, res,next) {
    GuardSessionsController.get_guard_sessions(req,res);
});

module.exports = router;