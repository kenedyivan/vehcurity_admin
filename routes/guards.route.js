let express = require('express');
let router = express.Router();
let GuardsController = require('../controllers/guards.controller');

/* GET guards listing. */
router.get('/', function(req, res,next) {
    GuardsController.get_guards(req,res);
});

/* GET add guard form. */
router.get('/create', function(req, res,next) {
    GuardsController.create_guard(req,res);
});

/* Save guard details. */
router.post('/save_guard_details', function(req, res) {
    //res.send("Howdy posting");
    GuardsController.save_guard(req,res);
});

/* DELETE guard. */
router.get('/:guardId/delete', function(req, res) {
    GuardsController.delete_guard(req,res,req.params.guardId);
});

/* Edit guard details. */
router.get('/:guardId/edit', function(req, res) {
    GuardsController.edit_guard(req,res,req.params.guardId);
});

/* Update guard details. */
router.post('/update', function(req, res) {
    GuardsController.update(req,res);
});

module.exports = router;