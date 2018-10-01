let express = require('express');
let router = express.Router();
let CashController = require('../controllers/cash_crediting.controller');

/* GET guards listing. */
router.get('/:sessionId', function (req, res, next) {
    CashController.payGuard(req, res);
});

module.exports = router;