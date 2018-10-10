let express = require('express');
let router = express.Router();
let CashController = require('../controllers/credit_payment_test.controller');

/* GET guards listing. */
router.get('/:sessionId', function (req, res) {
    CashController.payGuard(req, res);
});

module.exports = router;