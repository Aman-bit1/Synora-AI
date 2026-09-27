FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Vite environment variables
ARG VITE_FIREBASE_API_KEY
ARG VITE_SERVER_URL
ARG VITE_RAZORPAY_KEY_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

RUN npm run build


FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]