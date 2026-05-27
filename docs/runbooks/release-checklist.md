# Sentinel DNS v1 Release Checklist

## Build and Test
- `cargo check --workspace`
- `cargo test --workspace`
- `cargo clippy --workspace --all-targets -- -D warnings`
- `pnpm --dir apps/dashboard lint`
- `pnpm --dir apps/dashboard test`
- `pnpm --dir apps/dashboard build`

## Security
- `cargo audit`
- `cargo deny check`
- `pnpm --dir apps/dashboard audit --prod`
- Validate no unreviewed dependency additions.

## Publish (required for Pi `install.sh` pull path)
- Tag release: `git tag v0.1.1 && git push origin v0.1.1` (or run **release** workflow via Actions → workflow_dispatch).
- Wait for `push-images` to finish (control-plane + dashboard on GHCR).
- In GitHub: **Packages** → `sentinel-control-plane` and `sentinel-dashboard` → **Package settings** → set visibility to **Public** (anonymous `docker pull` fails with 403 while private).
- On a Pi: `docker pull ghcr.io/alexanderrrrrrw/sentinel-control-plane:latest` should succeed before sharing the install script.

## Operational
- Start with `docker compose -f deploy/docker-compose.yml up`.
- Verify API `/healthz` and `/metrics`.
- Verify dashboard can list devices and inspect CNAME chain.
- Validate SQLite backup and restore procedure.
