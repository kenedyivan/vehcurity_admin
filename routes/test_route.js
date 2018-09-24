let express = require('express');
let router = express.Router();
let controller = require('../controllers/test_controller');


router.get('/add_data', function(req, res,next) {
    controller.addData(req,res);
});

router.get('/sub_data', function(req, res,next) {
    controller.subData(req,res);
});


router.get('/get_data', function(req, res,next) {
    controller.getData(req,res);
});


module.exports = router;