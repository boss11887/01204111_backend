# pretest_web
=======
# Prerequisite
1. MongoDB running on port 27017 ( default port )
2. Docker

# Create database
go to database directory
```
cd database
```

you can change database name of the restore database by
```
mv test_website $yourDBName
```

restore mongodump
```
mongorestore 
```

# Deploy Backend
Create .dockerignore with these content to ignore these directory

```
node_modules
database
client
```

After using git pull or git clone to get all files, create .env files at the root of the project in which contain these texts.
```
PRIVATE_KEY=$private_key
DBURL=$database_url
UPLOADDIR='/data'
TESTTIMEINHOUR=$numberInHour
CORSORIGIN=$yourClientURL
```

then run this docker command at the root of the project to build images
```
docker build -t $tagname .
```

check docker images with
```
docker images
```

if you see docker images with your tagname now you can run docker images
```
docker run -p $portNumber:3000 -v $yourUploadDirPath:/data -v $yourWorkDir:/app/ $tagname
```

Now your backend should be up and running if you encounter any problems contact me. 

# Deploy frontend
go to client folder at the root of directory and run this command

```
cd client
npm install
npm run serve
```

these command will install necessary dependencies and run vue.

```
App running at:
  - Local:   http://localhost:8080/ 
```
you can copy these urls and open in browsers
