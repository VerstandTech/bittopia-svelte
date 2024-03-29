FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn build

# Path: Dockerfile

FROM node:18-alpine as runner

WORKDIR /app

COPY --from=builder /app/package*.json ./

RUN yarn install --production

COPY --from=builder /app/build ./build

ENTRYPOINT ["node", "./build"]
