const dotenv = require('dotenv').config()
const express = require('express');
const isAuthMiddleware = require('./isAuth');
const monk = require('monk');
const moment = require('moment');

const router = express.Router()

router.use(isAuthMiddleware);

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

router.get('/list/:testId', async (req, res, next) => {
  try {
    const curTest = await res.locals.db.get('Tests').findOne({
      _id : monk.id(req.params.testId)
    })

    if ( !curTest || moment().isAfter(moment(curTest.endTime)) || moment().isBefore(moment(curTest.startTime)) ) {
      res.status(400).json({
        err : 'testId is invalid'
      })
    }

    let objectIds = [];
    curTest.sectionId.forEach( (item) =>{
      objectIds.push(monk.id(item))
    })
    
    let allSections = await res.locals.db.get('Sections').aggregate([
      { $match : { _id : { $in : objectIds } } },
      { $lookup : {
        from : 'Problems',
        localField : 'problemId',
        foreignField : '_id',
        as : 'sectionProblems'
      }},
      { $project : {  "sectionProblems.modified" : 0 , fpath : 0, problemId : 0 } }
    ])
    allSections.forEach( (section) => {
      section.sectionProblems = getRandom(section.sectionProblems,section.size)
    })

    res.locals.testId = req.params.testId;
    res.status(200).json({
      sections : allSections
    })


  } catch (err) {
    res.status(500).json({ err : 'Internal Error' });
    next(err);
  }
})

router.get('/content/:problemId', async (req, res, next) => {
  try{
    const doc = await res.locals.db.get('Problems').findOne({
      _id : monk.id(req.params.problemId)
    })
    if ( !doc ){
      res.status(400).json({
        err : 'invalid problemId'
      })
    } else {
      res.status(200).json({
        pdfUrl : doc.pdfPath
      })
    }
  } catch(err) {
    next(err)
  }
})

module.exports = router;
