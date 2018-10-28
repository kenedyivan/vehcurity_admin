var express = require('express');
var router = express.Router();
var GuardRequestsController = require('../controllers/guard_requests.controller');

/* GET guard requests listing. */
router.get('/', function(req, res,next) {
    GuardRequestsController.get_guard_requests(req,res);
});

/* Delete all guard requests */
router.get('/delete-all', function(req, res,next) {
    GuardRequestsController.delete_all_requests(req,res);
});

module.exports = router;