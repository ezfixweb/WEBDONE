# Active24 Auto Deploy from GitHub

This repository now includes a workflow at `.github/workflows/deploy-active24.yml`.

When you push to `main`, GitHub Actions connects to your Active24 shell by SSH and runs:
1. `git fetch` + `git pull`
2. Optional install/build/restart commands (from secrets)

## 1) Choose target directory on Active24

Use your existing web root directly (no extra nested repo folder), for example:

`/home/USERNAME/ezfix.cz/web`

The workflow now creates this directory automatically if needed and initializes git there on first deploy.

## 2) Create SSH key pair for GitHub Actions

On your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-active24" -f ./active24_deploy_key
```

- `active24_deploy_key` (private key) will go to GitHub secret.
- `active24_deploy_key.pub` (public key) goes to Active24 `~/.ssh/authorized_keys`.

On Active24 shell:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys
# paste contents of active24_deploy_key.pub, then Ctrl+D
chmod 600 ~/.ssh/authorized_keys
```

## 3) Add GitHub repository secrets

In GitHub: `Settings -> Secrets and variables -> Actions -> New repository secret`

Required:
- `ACTIVE24_HOST`: your Active24 host (example: `server123.active24.cz`)
- `ACTIVE24_USER`: your shell username
- `ACTIVE24_SSH_PRIVATE_KEY`: content of `active24_deploy_key`
- `ACTIVE24_APP_DIR`: absolute path on server (example: `/home/username/ezfix.cz/web`)

Optional:
- `ACTIVE24_PORT`: SSH port (default is 22)
- `ACTIVE24_REPO_URL`: defaults to `https://github.com/ezfixweb/WEBDONE.git`
- `DEPLOY_INSTALL_COMMAND`: e.g. `npm --prefix backend ci --omit=dev`
- `DEPLOY_BUILD_COMMAND`: e.g. `npm --prefix backend run build`
- `DEPLOY_RESTART_COMMAND`: e.g. `pm2 restart ezfix-backend`

Recommended for your project:
- `DEPLOY_INSTALL_COMMAND`: `npm --prefix backend ci --omit=dev`
- `DEPLOY_RESTART_COMMAND`: `pm2 restart ezfix-backend || pm2 start backend/server.js --name ezfix-backend`

## 4) First test deploy

1. Push any commit to `main`.
2. Open `GitHub -> Actions -> Deploy to Active24`.
3. Confirm workflow success.
4. Check Active24 shell process logs (`pm2 logs` or your process manager logs).

## Notes

- For public repositories, HTTPS remote works without configuring GitHub SSH keys on the server.
- For private repositories, set `ACTIVE24_REPO_URL` to an authenticated URL (for example with a fine-grained PAT).
- You can also run deploy manually with `workflow_dispatch` from the Actions tab.
