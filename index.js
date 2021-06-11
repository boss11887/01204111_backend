const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const pretestRouter = require('./routes/pretest/')

require('dotenv').config()

const app = express()

const model = {
    User: new mongoose.model('users', {
        std: String,
        password: String
    })
}
mongoose
    .connect(process.env.DBURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then((db) => {
        app.use(
            cors({
                origin: process.env.CORSORIGIN,
                credentials: true
            })
        )
            .use((_req, res, next) => {
                res.locals.db = db
                res.locals.model = model

                next()
            })
            .get('/', (_req, res) => {
                res.send('homepage')
            })
            .use('/api/', pretestRouter)
            .listen(3000)
    })
