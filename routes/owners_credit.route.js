let express = require('express');
let router = express.Router();
let OwnersCreditController = require('../controllers/owners_credit.controller');

/* GET add owner credit form. */
router.get('/:ownerId/:credit/add', function(req, res) {
    OwnersCreditController.add_owner_credit_form(req,res);
});

/* Save owner credit details. */
router.post('/update-owner-credit', function(req, res) {
    OwnersCreditController.save_owner_credit(req,res);
});

module.exports = router;