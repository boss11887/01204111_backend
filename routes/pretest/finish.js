const express = require('express')
const dotenv = require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const monk = require('monk')

const router = express.Router()

router.use(cookieParser())

router.put('/', (req, res, next) => {
    jwt.verify(req.cookies.token, process.env.PRIVATE_KEY, (err, decoded) => {
        if (err) {
            res.status(401).json({ err: 'token invalid' })
        } else {
            res.locals.db.get('Logins').findOneAndUpdate(
                {
                    std: decoded.std,
                    testId: monk.id(decoded.testId)
                },
                {
                    $set: { isSubmit: true }
                }
            )
            res.status(200).send('success')
        }
    })
})

module.exports = router
