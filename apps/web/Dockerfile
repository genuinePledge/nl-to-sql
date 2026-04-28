FROM node:24-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm
RUN pnpm i

COPY . .

EXPOSE 5173

CMD [ "npm", "run", "dev", "--", "--host", "0.0.0.0" ]
