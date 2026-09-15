# Tattoos to the Max

Static, mobile-first homepage for Tattoos to the Max in Bad Ischl.

## Run locally

```sh
docker compose up --build
```

Open http://localhost:8080.

The site is intentionally framework-free: it is a content-led marketing page with no server-side application state. This makes the container small and simple to host through Plesk's Docker Compose support. Gallery images are currently remote placeholders and should be replaced with the studio's own optimized images before launch.
## Studio news

The bootstrap login is `studio` / `change-me-before-public-launch`. Change it immediately by setting `NEWS_USER` and `NEWS_PASSWORD` in an uncommitted `.env` file before exposing the site publicly. Shop helpers can open `/admin.html`, authenticate, and publish the headline, message, optional HTTPS link, and custom button label directly. News is stored in the private Docker volume `news-data`; the public site can only read it.
