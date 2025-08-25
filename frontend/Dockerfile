# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json /app/package.json
RUN npm ci --ignore-scripts=false || npm install
COPY . /app
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost/ | grep -q "<!doctype html>" || exit 1


