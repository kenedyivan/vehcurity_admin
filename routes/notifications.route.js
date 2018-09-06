var express = require('express');
var router = express.Router();
var NotificationsController = require('../controllers/notifications.controller');

/* GET notifications listing. */
router.get('/', function(req, res,next) {
    NotificationsController.get_notifications(req,res);
});

module.exports = router;