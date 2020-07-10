const express = require('express');
const authApi = require('./auth');
const problemsApi = require('./problems')
const answerApi = require('./answer');
const timeApi = require('./time');
const finishApi = require('./finish');
const availTestApi = require('./availTest');

const router = express.Router();

router.use('/auth',authApi);
router.use('/problems',problemsApi);
router.use('/answer',answerApi);
router.use('/time',timeApi);
router.use('/finish',finishApi);
router.use('/test',availTestApi);

module.exports = router;
