# wants_record_pwa

## Dual Deploy (GitHub Pages + Remote Server)

This repo now supports two independent GitHub Actions workflows:

- `preview.yml`: existing GitHub Pages deploy flow (unchanged).
- `deploy-server.yml`: deploys to your remote server only when push commit message contains `[release]`.

### 1) Prepare server directories

Run on your server (example path):

```bash
sudo mkdir -p /var/www/wants_record_pwa/.releases
sudo chown -R <your-user>:<your-user> /var/www/wants_record_pwa
```

Set your web server root to:

```text
/var/www/wants_record_pwa/current
```

### 2) Add repository secrets

In GitHub repo -> `Settings` -> `Secrets and variables` -> `Actions`, add:

- `SSH_HOST`: server IP or domain
- `SSH_USER`: SSH user
- `SSH_KEY`: private key content (recommended deploy key)
- `SSH_PORT`: SSH port (usually `22`)
- `SSH_TARGET_DIR`: deploy base dir (example: `/var/www/wants_record_pwa`)

### 3) Push to trigger deployment

Push to `main` with commit message containing `[release]`:

- GitHub Pages flow still runs as before.
- Remote server workflow uploads `dist/`, creates a new release directory,
  and repoints `current` symlink atomically.

If a push does not include `[release]`, remote server deployment will be skipped.

You can also run `deploy-server.yml` manually via `workflow_dispatch`.