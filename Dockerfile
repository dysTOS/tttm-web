FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html impressum.html datenschutz.html admin.html admin.js styles.css artist-section.css content-site.css legal.css script.js robots.txt sitemap.xml favicon.png favicon-512.png apple-touch-icon.png apple-touch-icon-180.png /usr/share/nginx/html/
COPY en /usr/share/nginx/html/en
COPY assets /usr/share/nginx/html/assets
EXPOSE 80
