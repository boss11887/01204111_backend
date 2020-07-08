const express = require('express');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser')
const formidableMiddleware = require('express-formidable');
const isAuthMiddleware = require('./isAuth');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const monk = require('monk');

const router = express.Router();

router.use(cookieParser());
router.use(isAuthMiddleware);
router.use(formidableMiddleware({
  uploadDir : process.env.UPLOADDIR,
  maxfilesize : 1 * 1024 * 1024, // 1mb
  keepExtensions : true
}));

router.post('/submit/file/:problemId', async (req, res, next) => {
  try{
    const form = req.files;

    // check for problemId
    console.log(req.params.problemId)
    const doc = await res.locals.db.get('Problems').findOne({
      _id : monk.id(req.params.problemId)
    })

    if ( Object.keys(form).length !== 0 ){
      if ( doc ){
        // insert file path to database
        res.locals.db.get('Answers').insert({
          std : res.locals.std,
          testId : res.locals.testId,
          problemId : req.params.problemId,
          filepath : form.userFile.path,
          filetype : form.userFile.type,
          filename : form.userFile.name,
          submittedTime : moment().format()
        })
        res.status(200).send('success');
      } else {
        fs.remove(form.userFile.path);
        res.status(400).json({ error : 'ProblemID not valid' });
      }
    }
  } catch(err) {
    next(err);
  }
})

router.post('/submit/text/:problemId', async (req, res, next) => {
  try{
    const doc = await res.locals.db.get('Problems').findOne({
      _id : monk.id(req.params.problemId)
    })

    if ( doc ){
      res.locals.db.get('Answers').insert({
        std : res.locals.std,
        testId : res.locals.testId,
        text : req.fields.userText,
        problemId : req.params.problemId,
        submittedTime : moment().format()
      })
      res.status(200).send('success');
    } else {
      res.status(400).json({ error : 'ProblemID not valid' });
    }
  } catch (err) {
    next(err);
  }
})

router.post('/submit/subjective/:sectionId', async (req, res, next) => {
  try {
    let allProblems = [];
    console.log(req.fields.userAnswer)
    Object.keys(req.fields.userAnswer).forEach( (_id) => {
      allProblems.push(monk.id(_id));
    })

    const allAnswers = await res.locals.db.get('Problems').aggregate([
      { $match : { _id : { $in : allProblems } } }
    ])

    // build object
    let scores = 0; 
    allAnswers.forEach( (record) => {
      if ( req.fields.userAnswer[String(record['_id'])] === Number(record['answer'])){
        scores += 1;
      }
    })
    
    // push result to database
    res.locals.db.get('Answers').insert(
      { 
        std : res.locals.std,
        testId : res.locals.testId,
        submitAnswer : req.fields.userAnswer,
        scores : scores,
        submittedTime : moment().format()
      }
    )
    res.status(200).send('sucess') 
  }catch(err) {
    next(err);
  }
})

module.exports = router;
