let express = require('express');
let router = express.Router();
let OwnersController = require('../controllers/owners.controller');

/* GET owners listing. */
router.get('/', function (req, res) {
    OwnersController.get_owners(req, res);
});

/* DELETE owner. */
router.get('/:ownerId/delete', function (req, res) {
    OwnersController.delete_owner(req, res, req.params.ownerId);
});

/* DELETE owner. */
router.post('/delete', function (req, res) {
    OwnersController.delete_owner_form(req, res);
});


module.exports = router;