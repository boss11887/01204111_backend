const express = require('express');
const jwt = require('jsonwebtoken');
const isAuthMiddleware = require('./isAuth');
const fs = require('fs-extra')

const router = express.Router()

router.use(isAuthMiddleware);

router.get('/list', async (req, res, next) => {
  try {
    const doc = await res.locals.db.get('Sections').aggregate([
      { $lookup : {
        from : "Problems",
        localField : "problemId",
        foreignField : "id",
        as : "problems"
      }},
      { $project : { 'problemId' : 0 } },
      { $unwind : '$problems' },
      { $sort : { 'problems.id' : 1 } },
      { $group : {
        _id : { 'id' : '$id' },
        id : { $first : '$id' },
        name : { $first : '$name' },
        title : { $first : '$title' },
        problems : { '$push' : '$problems' }
      }},
      { $sort : { 'id' : 1 } }
    ])
  } catch (err) {
    res.status(500).json({ error : 'Error occure' });
    next(err);
  }
})

router.get('/content/:problemID', async (req, res, next) => {
  try {
    const doc = await res.locals.db.get('Problems').findOne({
      id : Number(req.params.problemID)
    })
    res.status(200).json({
      pdfUrl : doc.pdfPath
    })
  } catch(err) {
    next(err);
  }
})

module.exports = router;
