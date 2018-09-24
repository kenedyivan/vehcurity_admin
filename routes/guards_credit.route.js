let express = require('express');
let router = express.Router();
let GuardsCreditController = require('../controllers/guards_credit.controller');

/* GET add guard credit form. */
router.get('/:guardId/add', function(req, res,next) {
    GuardsCreditController.add_guard_credit_form(req,res);
});

/* Save guard details. */
router.post('/update-guard-credit', function(req, res,next) {
    GuardsCreditController.save_guard_credit(req,res);
});

module.exports = router;