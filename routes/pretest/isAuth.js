const express = require('express');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const moment = require('moment');
const monk = require('monk');

const router = express.Router();

router.use(cookieParser());

router.use( async (req, res, next) => {
  const decoded = jwt.verify(req.cookies.token, process.env.PRIVATE_KEY)

  if ( !decoded ){
    res.status(401).json({
      err : 'token invalid'
    })
  }

  const curTest = await res.locals.db.get('Tests').findOne({
    _id : monk.id(decoded.testId)
  })

  const login = await res.locals.db.get('Logins').findOne({
      std : decoded.std,
      testId : monk.id(decoded.testId)
  })

  const testTimeDeta = Math.floor( curTest.testTimeInSecond -  (( moment().valueOf() - moment(login.loginTime).valueOf()) / 1000 ));
  const testEndDelta = Math.floor( ( moment(curTest.endTime).valueOf() - moment().valueOf() ) / 1000 ); 
        
  if ( moment().isBefore(curTest.startTime) ){
    res.status(401).json({ err : 'Test has not been started yet' })
  } else if ( Boolean(login.isSubmit) || moment().isAfter(curTest.endTime)){
    res.status(401).json({ err : 'test finish' });
  } else {
    res.locals.std = decoded.std,
    res.locals.testId = decoded.testId

    if ( testTimeDeta <= 0 ){
      res.status(401).json({ err : 'timeout' });
    } else {
      res.locals.timeLeft = testTimeDeta < testEndDelta ? testTimeDeta : testEndDelta;
      next();
    }
  }
})
    
module.exports = router

