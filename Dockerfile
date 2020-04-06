FROM node:latest
RUN mkdir /app
WORKDIR /app
ADD package.json /app/
ADD yarn.lock /app/
RUN yarn global add prisma graphql-cli nodemon
RUN yarn install
ADD core /app/core
ADD public /app/public
ADD server /app/server
ADD src /app/src
ADD config-overrides.js /app/config-overrides.js
ADD .graphqlconfig /app/.graphqlconfig
CMD ["yarn", "run" , "start-docker"]
EXPOSE 3000 4000 5000
