# Tattoos to the Max

Static, mobile-first homepage for Tattoos to the Max in Bad Ischl.

## Run locally

```sh
docker compose up --build
```

Open http://localhost:8080.

The frontend is intentionally framework-free. A small Node service stores the optional studio news message, while the rest of the site remains static. This keeps the containers small and straightforward to host through Plesk's Docker Compose support.
## Studio news

Set `NEWS_USER` and `NEWS_PASSWORD` in an uncommitted `.env` file before exposing the site publicly. The fallback credentials in `docker-compose.yml` are intended only for local development. Studio staff can open `/admin.html`, authenticate, publish separate German and English content, add an optional HTTPS link and button label, or hide the message without deleting its content. News is stored in the private Docker volume `news-data`; the public site can only read it. Existing news data in the original flat format is migrated in memory and remains readable.
