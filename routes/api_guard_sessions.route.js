let express = require('express');
let router = express.Router();
let ApiGuardSessionsController = require('../controllers/api_guard_sessions.controller.controller');

/* GET guard sessions listing. */
router.get('/create-guarding-session/:guardId/:ownerId/:duration/:startTime/:endTime/:totalCost/:' +
    'status/:minute/:hour/:day/:month/:requestKey/:paymentType', function(req, res,next) {
    ApiGuardSessionsController.create_guard_session(req,res);
});

module.exports = router;