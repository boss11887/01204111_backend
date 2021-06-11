const express = require('express')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const isAuthMiddleware = require('./isAuth')
const dotenv = require('dotenv').config()

const router = express.Router()

router.use(cookieParser())
router.use(isAuthMiddleware)

router.get('/', async (req, res, next) => {
    res.status(200).json({
        timeLeft: res.locals.timeLeft
    })
})

module.exports = router
