const dotenv = require('dotenv').config()
const express = require('express');
const moment = require('moment');
const isLogin = require('./isLogin');

const router = express.Router();
router.use(isLogin);

router.get('/list', async (req, res, next) => {
    let curTime = moment().toDate()
    const allTests = await res.locals.db.get('Tests').aggregate([
      { 
        $match :  { $and : [
          { 'startTime' : { $lte : curTime }},
          { 'endTime' : { $gte : curTime } }
      ]}},
    ])
  
    let allTestsId = {};
    allTests.forEach( (record) => {
      allTestsId[record._id] = {};
      allTestsId[record._id]['name'] = record.testName;
      allTestsId[record._id]['isSubmit'] = false;
    } )

    const Login = await res.locals.db.get('Logins').aggregate([
      { $match : { 'testId' : { $in :  Object.keys(allTestsId) }}}
    ])

    Login.forEach( (record) => {
      if ( record.isSubmit ){
        allTestsId[record.testId]['isSubmit'] = true;
      }
    })

    res.status(200).json({
      test : allTestsId
    })
})

module.exports = router;
