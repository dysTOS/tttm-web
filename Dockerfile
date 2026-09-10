FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html impressum.html datenschutz.html styles.css artist-section.css legal.css script.js robots.txt sitemap.xml favicon.png apple-touch-icon.png /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
EXPOSE 80
