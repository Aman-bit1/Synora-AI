FROM node
WORKDIR /app
# this is to copy backend root all package.json
COPY package*.json ./
RUN npm install

COPY ./services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install

COPY services/billing ./services/billing
COPY shared ./shared

WORKDIR /app/services/billing

EXPOSE 8004

CMD [ "npm","start" ]