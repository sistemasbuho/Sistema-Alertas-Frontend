# Etapa 1: compilar la SPA (tsc + vite) dentro de la imagen
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: servir el build con nginx
FROM nginx:alpine

COPY my_custom_config/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 86
