const express = require('express')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')

const router = express.Router()

router.use(cookieParser())

router.use(async (req, res, next) => {
    const decoded = jwt.verify(req.cookies.token, process.env.PRIVATE_KEY)

    if (!decoded) {
        res.status(401).json({
            err: 'token invalid'
        })
    }

    next()
})

module.exports = router
