FROM nginx:alpine

# No se copia ./dist: docker-compose monta ./frontend/dist como volumen
# sobre /usr/share/nginx/html, así que copiarlo solo forzaba rebuilds.

EXPOSE 3033