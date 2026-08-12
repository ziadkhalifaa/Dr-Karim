# Deployment Notes

## TODO (blocker before production)

> Before production deployment, configure the web server/Hostinger routing so
> unknown frontend routes such as `/assessment` rewrite to `/index.html`,
> otherwise direct refresh/navigation to `/assessment` may return 404.

The assessment uses a custom `pushState` router (`src/lib/router.js`). In
development (Vite dev server) any route is served; on a static host without
SPA fallback a direct request to `/assessment` returns 404.

### Approach

- **Apache (`.htaccess`):** enable a rewrite/fallback so unknown frontend
  routes serve `index.html` (standard SPA pattern).
- **Hostinger:** equivalent server-level web-server rewrite/fallback for
  `hPanel`-managed sites.

### Important

Do **not** implement a Hostinger-specific rewrite blindly. Only apply it after
confirming the project's actual deployment setup on the target host; the exact
configuration differs between Apache-only, LiteSpeed, and subdomain-based
setups.

### Checklist

- [ ] Confirm target host/server type (Apache / LiteSpeed / other).
- [ ] Configure SPA fallback so `/assessment` and any future frontend route
      rewrite to `/index.html`.
- [ ] Re-test direct load, refresh, and in-app navigation to `/assessment`
      after deploying.