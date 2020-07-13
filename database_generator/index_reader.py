from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import ReturnDocument
from os import path, getcwd, walk
from copy import deepcopy
import re


db = MongoClient('localhost:27017')['01204111_website']

# with open('/home/saito/secret/01204111_website.env') as f:
    # username = f.read().splitlines()[0]
    # password = f.read().splitlines()[1]
    # db = MongoClient('localhost:27017',
                     # username = username,
                     # password = password,
                     # authSource = '01204111_website',
                     # authMechanism='SCRAM-SHA-1'
                     # )

def allProblemsReader(fpath, sectionType):
    col = db.Problems

    allProblems = list()
    template = dict()

    with open(fpath) as f:
        for line in f.read().strip().split('\n'):
            if len(line) == 0:
                continue

            if sectionType == 'form':
                template['problemContent'] = line
                allProblems.append(template)
                template = deepcopy(dict())

            elif sectionType == 'subjective':
                problemContentMatcher = re.match(r'^(?!\s)(.+)$',line)
                choicesMatcher = re.match(r'^choice(\s*):(\s*)(.+)$',line)
                answerMatcher = re.match(r'^answer(\s*):(\s*)(\d)',line)


                if len(template.keys()) == 3:
                    allProblems.append(template)
                    template = deepcopy(dict())

                if choicesMatcher:
                    template['choices'].append(choicesMatcher.group(3))
                elif answerMatcher:
                    template['answer'] = answerMatcher.group(3)
                elif problemContentMatcher:
                    template['problemContent'] = problemContentMatcher.group(1)
                    template['choices'] = list()
                else:
                    raise(Exception(f'FormatError: {fpath} format error.'))


            elif sectionType == 'programming':
                problemContentMatcher = re.match(r'^(?!\s)([\w\s\d]+)$',line)
                urlMatcher = re.match(r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)',line)

                if len(template.keys()) == 2:
                    allProblems.append(template)
                    template = deepcopy(dict())

                if urlMatcher:
                    template['pdfPath'] = line.strip()
                elif problemContentMatcher:
                    template['problemContent'] = problemContentMatcher.group(1)


    allProblems.append(template)
    
    if len(allProblems[-1].keys()) == 0:
        allProblems.pop(-1)

    _id = list()
    for problem in allProblems:
        updatedRecord = col.find_one_and_update(problem,{'$addToSet' : { 'modified' : datetime.utcnow()}},upsert=True,return_document=ReturnDocument.AFTER)
        _id.append(updatedRecord['_id'])
    return _id

def indexReader():
    allSections = list()
    template = dict()

    with open('index.txt') as f:
        for line in f.read().strip().split('\n'):
            isSectionHeader = re.match('^(?!\s)"([\w\s]+)"\s(\w+)$',line)
            isSectionContent = re.match('^\s(.+)$',line)

            if len(line) == 0:
                continue

            if len(template.keys()) == 6:
                allSections.append(template)
                template = dict()

            if isSectionHeader:
                template['name'] = 'ส่วนที่ ' + str(len(allSections) + 1)
                template['title'] = isSectionHeader.group(1)
                template['type'] = isSectionHeader.group(2)

            elif isSectionContent:
                fPath = isSectionContent.group(1).split()[0]
                sampleSize = isSectionContent.group(1).split()[1]
                template['problemId'] = allProblemsReader(path.join(getcwd(),fPath), template['type'])
                template['size'] = int(sampleSize)
                template['fpath'] = path.join(getcwd(),fPath)
            else:
                raise(Exception('FormatError: index.txt format error'))

    allSections.append(template)
    _id = db.Sections.insert_many(allSections)
    return _id.inserted_ids

if __name__ == '__main__':
    testName = input("Enter test name : ")
    testTimeInSecond = int(input("Test time in seconds : "))
    startTime = input('Start test time format (%Y-%m-%d %H:%M) : ')
    endTime = input('End test time format (%Y-%m-%d %H:%M) : ')

    startTime = datetime.strptime(startTime,"%Y-%m-%d %H:%M")
    endTime = datetime.strptime(endTime,"%Y-%m-%d %H:%M")
    
    startTime = datetime.utcfromtimestamp(startTime.timestamp())
    endTime = datetime.utcfromtimestamp(endTime.timestamp())
    _id = indexReader()
    db.Tests.insert_one({
        'testName' : testName,
        'testTimeInSecond' : testTimeInSecond,
        'startTime' : startTime,
        'endTime' : endTime,
        'sectionId' : _id
    })
