const express = require('express');
const bodyparser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config()
const moment = require('moment');

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
    const { firstname, lastname } = req.body;
    const doc = await res.locals.db.get('Users').findOne({ firstname, lastname });
    const doc2 = await res.locals.db.get('Login').findOne({ firstname, lastname });

    // check logintime and now if it within test time
    const loginTime = doc2 ? doc2.loginTime : moment().format();
    const isValidTime =  Math.floor(( moment().valueOf() - moment(loginTime).valueOf()) / 1000 ) < ( process.env.TESTTIMEINHOUR * 60 * 60 );

    // check if login is valid
    if ( !isValidTime ){
      res.status(401).json({ err : "timeout" });
    }
    else if ( doc2 && doc2.isSubmit ){
      res.status(401).json({ err : 'test finish' })
    }
    if ( isValidTime && doc ){
      if ( !doc2 ){
        res.locals.db.get('Login').insert({
          firstname,
          lastname,
          loginTime : moment().format(),
          isSubmit : false
        })
      }
      const private_key = process.env.PRIVATE_KEY;
      const payload = { firstname, lastname };
      const token = jwt.sign(payload, private_key);

      res.cookie('token',token).status(200).send('success');
    } else {
      res.status(401).json({ err : "firstname and lastname don't match in database" })
    }
  } catch(err) {
    next(err);
  }
})

module.exports = router;
