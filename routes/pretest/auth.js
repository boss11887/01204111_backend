const express = require('express');
const bodyparser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config()
const moment = require('moment');
const crypto = require('crypto');
const monk = require('monk')

const router = express.Router()

router.use(
  bodyparser.urlencoded({
    extended : true
  })
);

router.use(bodyparser.json());
router.use(cookieParser());

router.post('/login', async (req,res,next) => {
  try{
    const { std, password } = req.body;

    // hash password
    const hash = crypto.createHash('sha256');
    hash.update( 
      password
    )
    const hash_password = hash.digest('hex');
    const valid_user = await res.locals.db.get('Users').findOne(
      {
        std,
        password : hash_password
      }
    );

    if ( !valid_user ){
      res.status(401).json({ err : 'invalid user' })
    }
      
    // get current testId
    const curTest = await res.locals.db.get('Tests').findOne({
      testName : process.env.TESTNAME
    })

    // get_login
    const latestLogin = await res.locals.db.get('Logins').findOne({
      std : std,
      testId : monk.id(curTest._id)
    })

    const loginTime = latestLogin ? moment(latestLogin.loginTime) : moment()
    const isValidTime = Math.floor(
      ( moment().valueOf() - loginTime.valueOf()) / 1000
    ) < curTest.testTimeInSecond

    // check if login is valid
    if ( !isValidTime ){
      res.status(401).json({ err : "timeout" });
    }
    else if ( latestLogin && latestLogin.isSubmit ){
      res.status(401).json({ err : 'test finish' })
    }
    if ( isValidTime ){
      if ( !latestLogin ){
        res.locals.db.get('Logins').insert({
          std,
          testId : curTest._id,
          loginTime : moment().format(),
          isSubmit : false
        })
      }
      const private_key = process.env.PRIVATE_KEY;
      const payload = { std, testId : curTest._id };
      const token = jwt.sign(payload, private_key);
      res.cookie('token',token).status(200).send('success');
    }  
  } catch(err) {
    next(err);
  }
})

module.exports = router;
