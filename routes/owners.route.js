let express = require('express');
let router = express.Router();
let OwnersController = require('../controllers/owners.controller');

/* GET owners listing. */
router.get('/', function(req, res,next) {
    OwnersController.get_owners(req,res);
});

/* DELETE owner. */
router.get('/:ownerId/delete', function(req, res,next) {
    OwnersController.delete_owner(req,res,req.params.ownerId);
});


module.exports = router;