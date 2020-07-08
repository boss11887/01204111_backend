const express = require('express');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
var ObjectId = require('mongodb').ObjectID;
const moment = require('moment');
const monk = require('monk');

const router = express.Router();

router.use(cookieParser());

router.use( async (req, res, next) => {
  const decoded = jwt.verify(req.cookies.token, process.env.PRIVATE_KEY)
  const doc = await res.locals.db.get('Logins').findOne({
      std : decoded.std,
      testId : monk.id(decoded.testId)
  })

  let timeDelta = Math.floor( ( moment().valueOf() - moment(doc.loginTime).valueOf()) / 1000 );
        
  if ( Boolean(doc.isSubmit) ){
    res.status(401).json({ err : 'test finish' });
  } else {
    res.locals.std = decoded.std,
    res.locals.testId = decoded.testId

    const test = await res.locals.db.get('Tests').findOne({
      _id : res.locals.testId
    })

    const timeLeft = test.testTimeInSecond - timeDelta;
    if ( timeLeft <= 0 ){
      res.status(401).json({ err : 'timeout' });
    } else {
      res.locals.timeLeft = timeLeft;
      next();
    }
  }
})
    
module.exports = router

