FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common/package.json ./common/package.json
RUN npm ci --omit=dev --ignore-scripts

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev

COPY common ../common
COPY frontend/src ./src
COPY frontend/static ./static

EXPOSE 8888

CMD ["npm", "start"]
