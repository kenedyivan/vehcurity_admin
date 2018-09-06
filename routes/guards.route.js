var express = require('express');
var router = express.Router();
var GuardsController = require('../controllers/guards.controller');

/* GET guards listing. */
router.get('/', function(req, res,next) {
    GuardsController.get_guards(req,res);
});

/* GET guards listing. */
router.get('/create', function(req, res,next) {
    GuardsController.create_guard(req,res);
});

/* Save guard details. */
router.post('/', function(req, res,next) {
    GuardsController.save_guard(req,res);
});

/* DELETE guard. */
router.get('/:guardId/delete', function(req, res,next) {
    GuardsController.delete_guard(req,res,req.params.guardId);
});

/* Edit guard details. */
router.get('/:guardId/edit', function(req, res,next) {
    GuardsController.edit_guard(req,res,req.params.guardId);
});

/* Update guard details. */
router.post('/update', function(req, res,next) {
    GuardsController.update(req,res);
});

module.exports = router;