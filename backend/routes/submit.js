const { Router } = require('express');
const { submitController } = require('../controllers/submitController');
const router = Router();
router.post('/', submitController);
module.exports = router;
