var express = require('express');
var router = express.Router();
var GuardRequestsController = require('../controllers/guard_requests.controller');

/* GET guard requests listing. */
router.get('/', function(req, res,next) {
    GuardRequestsController.get_guard_requests(req,res);
});

module.exports = router;