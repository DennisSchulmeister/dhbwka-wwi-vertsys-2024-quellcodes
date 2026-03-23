FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common/package.json ./common/package.json
RUN npm ci --omit=dev --ignore-scripts

WORKDIR /app/microservice2

COPY microservice2/package.json microservice2/package-lock.json ./
RUN npm ci --omit=dev

COPY common ../common
COPY microservice2/src ./src
COPY microservice2/static ./static

EXPOSE 9001

CMD ["npm", "start"]
