var express = require('express');
var router = express.Router();
var OwnerPaymentMethod = require('../controllers/owners_payment_method.controller');

/* GET notifications listing. */
router.get('/:userId/:cardNumber/:month/:year/:cvv/:cardName/:address/:phone', function (req, res, next) {
    OwnerPaymentMethod.save_visa_details(req, res);
});

router.get('/', function (req, res, next) {
    OwnerPaymentMethod.get_owner_visa_methods(req, res);
});

module.exports = router;
