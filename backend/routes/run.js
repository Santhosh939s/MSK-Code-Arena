const { Router } = require('express');
const { runController } = require('../controllers/runController');
const router = Router();
router.post('/', runController);
module.exports = router;
