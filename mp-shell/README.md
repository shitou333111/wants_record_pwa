# mp-shell

This is a minimal WeChat Mini Program shell that opens your existing H5 site with `web-view`.

## What to change before running

1. Replace `appid` in `project.config.json` with your real Mini Program AppID.
2. Make sure the H5 URL in `pages/index/index.js` is your production HTTPS URL.
3. In WeChat Mini Program admin console, configure the H5 domain as a `business domain`.

## Run in WeChat DevTools

1. Open WeChat DevTools.
2. Import this folder: `mp-shell/`.
3. Build and preview.

## Notes

- Keep this shell thin. Most feature updates should stay in the H5 project.
- If you change domain, update `pages/index/index.js` and the Mini Program domain config.
