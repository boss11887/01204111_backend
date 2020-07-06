const express = require('express');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser')
const formidableMiddleware = require('express-formidable');
const isAuthMiddleware = require('./isAuth');
const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const moment = require('moment');

const router = express.Router();

router.use(cookieParser());
router.use(isAuthMiddleware);
router.use(formidableMiddleware({
  uploadDir : process.env.UPLOADDIR,
  maxfilesize : 1 * 1024 * 1024, // 1mb
  keepExtensions : true
}));

router.post('/submit/file/:problemID', async (req, res, next) => {
  try{
    const form = req.files;

    // check for problemID
    const doc = await res.locals.db.get('Problems').findOne({
      id : Number(req.params.problemID)
    })

    if ( Object.keys(form).length !== 0 ){
      if ( doc ){
        // insert file path to database
        res.locals.db.get('Answers').insert({
          firstname : res.locals.firstname,
          lastname : res.locals.lastname,
          problemID : req.params.problemID,
          filepath : form.userFile.path,
          filetype : form.userFile.type,
          filename : form.userFile.name,
          submittedTime : moment().format()
        })
        res.status(200).send('success');
      } else {
        fs.remove(form.test.path);
        res.status(400).json({ error : 'ProblemID not valid' });
      }
    }
  } catch(err) {
    next(err);
  }
})

router.post('/submit/text/:problemID', async (req, res, next) => {
  try{
    const doc = await res.locals.db.get('Problems').findOne({
      id : Number(req.params.problemID)
    })

    if ( doc ){
      const hash = crypto.createHash('sha256');
      hash.update( res.locals.firstname + res.locals.lastname + req.params.problemID + String(new Date()) );
      const fname = hash.digest('hex');
      fs.writeFile( path.join( process.env.UPLOADDIR , fname), req.fields.userText, (err) => {
        next(err);
      })
      res.locals.db.get('Answers').insert({
        firstname : res.locals.firstname,
        lastname : res.locals.lastname,
        problemID : req.params.problemID,
        filepath : path.join( process.env.UPLOADDIR, fname ),
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

router.post('/submit/subjective', async (req, res, next) => {
  try {
    const section = await res.locals.db.get('Sections').findOne({
      'id' : Number(req.fields.sectionNumber)
    });
    
    const allAnswers = await res.locals.db.get('Problems').aggregate([
      { '$match' : {  'id' : { '$in' : section.problemId } } },
      { '$project' : { 'id' : 1, 'answer' : 1 , '_id' : 0 } }
    ])
    
    // build object
    let scores = 0; 
    allAnswers.forEach( (record) => {
      if ( req.fields.userAnswer[String(record['id'])] === Number(record['answer'])){
        scores += 1;
      }
    })
    
    // push result to database
    res.locals.db.get('Answers').insert(
      { 
        firstname : res.locals.firstname,
        lastname : res.locals.lastname,
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
