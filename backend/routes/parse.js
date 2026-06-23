const { Router } = require('express');
const { parseProblemController } = require('../controllers/parseProblemController');
const router = Router();
router.post('/', parseProblemController);
module.exports = router;
