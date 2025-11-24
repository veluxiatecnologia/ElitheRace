const express = require('express');
const router = express.Router();
const peTemplateController = require('../controllers/peTemplateController');

router.get('/', peTemplateController.getPeTemplates);
router.post('/', peTemplateController.createPeTemplate);
router.delete('/:id', peTemplateController.deletePeTemplate);

module.exports = router;
