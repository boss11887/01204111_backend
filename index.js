const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const monk = require('monk');

const app = express();
const pretestRouter = require('./routes/pretest/');

const db = monk(process.env.DBURL, { authSource : 'pretest' });

app.use(cors({
  origin : process.env.CORSORIGIN,
  credentials : true
}));

app.get('/', (req, res) => {
  res.send('homepage');
})

db.then(() => {
  console.log('connect to db');
  app.use( (req, res, next) => {
    res.locals.db = db;    
    next();
  })
  app.use('/api/', pretestRouter);
})

app.listen(3000);
