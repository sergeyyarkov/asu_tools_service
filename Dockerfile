ARG NODE_IMAGE=node:24.14.0-slim

FROM ${NODE_IMAGE} 
ENV PORT=3001

WORKDIR /app
COPY package*.json .
COPY . .
RUN npm ci --only=production

EXPOSE ${PORT}

CMD [ "node", "index.js" ]