FROM node:14.3.0-alpine3.10
RUN mkdir /data/
RUN mkdir /app
WORKDIR /app
COPY . .
RUN npm install
RUN npm update
ENTRYPOINT [ "npm", "start" ]
