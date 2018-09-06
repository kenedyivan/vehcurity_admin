var express = require('express');
var router = express.Router();
var DashboardController = require('../controllers/dashboard.controller');

/* GET guard requests listing. */
router.get('/', function(req, res,next) {
    DashboardController.index(req,res);
});

module.exports = router;