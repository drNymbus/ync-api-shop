FROM node:16

WORKDIR /usr/src/app

# Install app dependencies
COPY home.html ./
COPY package*.json ./
RUN npm install

# If you are building your code for production
# RUN npm ci --omit=dev

COPY js ./js

COPY index.js ./index.js

ENTRYPOINT ["node", "index.js"]