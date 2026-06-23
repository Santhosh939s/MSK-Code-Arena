const { Router } = require('express');
const { generateTemplateController } = require('../controllers/generateTemplateController');
const router = Router();
router.post('/', generateTemplateController);
module.exports = router;
