const express = require('express');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const moment = require('moment');

const router = express.Router();

router.use(cookieParser());

router.use( async (req, res, next) => {
  jwt.verify(req.cookies.token, process.env.PRIVATE_KEY, (err, decoded) => {
    if (err){
      res.status(401).json({ err : 'token invalid' });
    } else {
      res.locals.db.get('Login').findOne({
        firstname : decoded.firstname,
        lastname : decoded.lastname
      })
        .then( (doc) => {
          const now = moment();
          let timeDelta = Math.floor( ( moment().valueOf() - moment(doc.loginTime).valueOf()) / 1000 );
          
          if ( Boolean(doc.isSubmit) ){
            res.status(401).json({ err : 'test finish' });
          } else {
            res.locals.firstname = decoded.firstname;
            res.locals.lastname = decoded.lastname;
            res.locals.timeDelta = timeDelta;
            next();
          }
        })
    }
  })
})
      
module.exports = router

