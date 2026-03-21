FROM node:lts-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY index.html .
COPY vite.config.js .
COPY public/ public/
COPY src/ src/

EXPOSE 3000

CMD ["npm", "run", "dev"]
