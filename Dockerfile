# AI Maestro download site: static files served by nginx.
# Railway injects PORT at run time; the entrypoint renders nginx.conf from the template.
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY index.html robots.txt google7c834d0c282fdb94.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets

ENV PORT=8080
ENV GOOGLE_SITE_VERIFICATION=
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1
