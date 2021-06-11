const express = require('express')
const bodyparser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const monk = require('monk')

const router = express.Router()

router.use(
    bodyparser.urlencoded({
        extended: true
    })
)

router.use(bodyparser.json())
router.use(cookieParser())

router.post('/login', async (req, res, next) => {
    console.log("A")

    try {
        const { std, password } = req.body

        // hash password
        const hash = crypto.createHash('sha256')
        hash.update(password)
        const hash_password = hash.digest('hex')
        const valid_user = await res.locals.model.User.where({
            std,
            password: hash_password
        }).findOne()

        if (!valid_user) {
            res.status(401).json({ err: 'invalid user' })
        }

        const private_key = process.env.PRIVATE_KEY
        const payload = { std }
        const token = jwt.sign(payload, private_key)
        res.cookie('token', token).status(200).send('success')
    } catch (err) {
        next(err)
    }
})

router.post('/start_test/:testId', async (req, res, next) => {
    try {
        console.log(req.cookies)
        const decoded = jwt.verify(req.cookies.token, process.env.PRIVATE_KEY)

        const doc = res.locals.db.get('Tests').findOne({
            _id: req.params.testId
        })

        if (!doc) {
            res.status(400).json({
                err: 'invalid testId'
            })
        }

        if (!decoded) {
            res.status(401).json({
                err: 'token invalid'
            })
        }

        const login = await res.locals.db.get('Logins').findOne({
            std: decoded.std,
            testId: monk.id(req.params.testId)
        })

        if (!login) {
            res.locals.db.get('Logins').insert({
                std: decoded.std,
                testId: monk.id(req.params.testId),
                loginTime: new Date(),
                isSubmit: false,
                IP: req.headers['X-Real-IP']
            })
        }

        const payload = {
            std: decoded.std,
            testId: req.params.testId
        }

        token = jwt.sign(payload, process.env.PRIVATE_KEY)
        res.cookie('token', token).status(200).send('success')
    } catch (err) {
        next(err)
    }
})

module.exports = router
