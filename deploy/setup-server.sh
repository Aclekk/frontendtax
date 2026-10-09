#!/usr/bin/env bash
set -euo pipefail

# Setup sekali di server Ubuntu Huawei untuk tax-refund-frontend.
# Hanya menambah direktori & port 5160 — tidak mengubah container/app lain.
# Usage: sudo bash deploy/setup-server.sh

DEPLOY_PATH="${DEPLOY_PATH:-/home/ubuntu/docker/tax_refund_frontend}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"

echo "==> Pastikan Docker aktif (tidak menginstall ulang jika sudah ada)"
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker belum terpasang. Jangan lanjut — cek setup app yang sudah ada."
  exit 1
fi

systemctl enable docker >/dev/null 2>&1 || true
systemctl start docker

echo "==> Pastikan gitlab-runner bisa memakai Docker"
usermod -aG docker gitlab-runner 2>/dev/null || true
usermod -aG docker "${DEPLOY_USER}" 2>/dev/null || true

echo "==> Buat direktori deploy (baru, terpisah dari app lain)"
mkdir -p "${DEPLOY_PATH}/deploy"
if id "${DEPLOY_USER}" >/dev/null 2>&1; then
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_PATH}"
fi

echo "==> Buka port 5160 saja (tidak mengubah rule UFW yang sudah ada)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 5160/tcp || true
fi

echo ""
echo "Setup selesai."
echo "Langkah berikutnya:"
echo "  1. Register GitLab Runner (tambah runner baru, jangan hapus yang lama):"
echo "       gitlab-runner register --non-interactive \\"
echo "         --url https://gitlab.delamibrands.com \\"
echo "         --token <TOKEN> \\"
echo "         --executor shell \\"
echo "         --description tax_refund_frontend \\"
echo "         --tag-list tax_refund_frontend"
echo "  2. Buat file env:"
echo "       cp ${DEPLOY_PATH}/deploy/env.production.example ${DEPLOY_PATH}/.env"
echo "  3. Push ke branch main untuk trigger deploy"
echo ""
echo "Akses setelah deploy:"
echo "  http://110.239.86.241:5160"
echo "  http://110.239.86.241:5160/api/health"
