var express = require('express');
var router = express.Router();
var GuardsOnlineController = require('../controllers/guards_online.controller');

/* GET guards online listing. */
router.get('/', function(req, res,next) {
    GuardsOnlineController.get_guard_online(req,res);
});

module.exports = router;