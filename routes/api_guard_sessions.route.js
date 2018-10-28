let express = require('express');
let router = express.Router();
let ApiGuardSessionsController = require('../controllers/api_guard_sessions.controller');

/* GET guard sessions listing. */
router.get('/create-guarding-session/:guardId/:ownerId/:duration/:startTime/:endTime/:totalCost/:' +
    'status/:minute/:hour/:day/:month/:requestKey/:requestCommitKey', function(req, res,next) {
    ApiGuardSessionsController.create_guard_session(req,res);
});

router.get('/stop/:requestCommitKey', function (req, res) {
    ApiGuardSessionsController.stopGuardSession(req, res) //Destroys task
});

router.get('/end-session/:id', function (req, res) {
    ApiGuardSessionsController.destroyTask(req.params.id) //Destroys task
});

module.exports = router;