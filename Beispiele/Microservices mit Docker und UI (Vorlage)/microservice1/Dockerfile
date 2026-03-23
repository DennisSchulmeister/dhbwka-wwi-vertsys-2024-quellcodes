FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common/package.json ./common/package.json
RUN npm ci --omit=dev --ignore-scripts

WORKDIR /app/microservice1

COPY microservice1/package.json microservice1/package-lock.json ./
RUN npm ci --omit=dev

COPY common ../common
COPY microservice1/src ./src
COPY microservice1/static ./static

EXPOSE 9000

CMD ["npm", "start"]
