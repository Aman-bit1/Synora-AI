FROM node
WORKDIR /app
# this is to copy backend root all package.json
COPY package*.json ./
RUN npm install

COPY ./services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

COPY services/agent ./services/agent
COPY shared ./shared

WORKDIR /app/services/agent

EXPOSE 8003

CMD [ "npm","start" ]