#!/bin/bash
# =======================================================
# PKM Review — Deploy Script
# Jalankan di VPS: bash deploy.sh
# =======================================================
set -e

PROJECT_DIR="/opt/pkm-review"
REPO_URL="git@github.com:NeoCode29/pkm-review-system.git"
DOMAIN="yourdomain.com"                                     # Ganti dengan domain Anda

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

# =======================================================
# STEP 1: Install dependencies (pertama kali saja)
# =======================================================
install_dependencies() {
    log "Menginstall Docker..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    else
        warn "Docker sudah terinstall, skip."
    fi

    log "Menginstall Docker Compose..."
    if ! command -v docker compose &> /dev/null; then
        apt-get install -y docker-compose-plugin
    else
        warn "Docker Compose sudah terinstall, skip."
    fi

    log "Menginstall Nginx & Certbot..."
    apt-get update -q
    apt-get install -y nginx certbot python3-certbot-nginx
}

# =======================================================
# STEP 2: Clone atau pull repo
# =======================================================
setup_repo() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        log "Menarik perubahan terbaru dari repo..."
        cd "$PROJECT_DIR"
        git pull origin master
    else
        log "Mengkloning repo ke $PROJECT_DIR..."
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
}

# =======================================================
# STEP 3: Setup environment variables
# =======================================================
setup_env() {
    cd "$PROJECT_DIR"
    if [ ! -f ".env" ]; then
        warn ".env belum ada. Menyalin dari .env.production.example..."
        cp .env.production.example .env
        err "Isi file .env terlebih dahulu, lalu jalankan script ini lagi!"
    else
        log ".env sudah ada."
    fi
}

# =======================================================
# STEP 4: Issue SSL certificate (pertama kali saja)
# =======================================================
setup_ssl() {
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log "Meng-issue SSL certificate untuk $DOMAIN..."
        # Pastikan nginx sudah berjalan untuk domain validation
        systemctl start nginx || true
        certbot --nginx \
            -d "$DOMAIN" \
            -d "www.$DOMAIN" \
            -d "api.$DOMAIN" \
            -d "auth.$DOMAIN" \
            --non-interactive \
            --agree-tos \
            --email "admin@$DOMAIN"

        # Link sertifikat ke folder nginx ssl project
        mkdir -p "$PROJECT_DIR/nginx/ssl/live/$DOMAIN"
        ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
               "$PROJECT_DIR/nginx/ssl/live/$DOMAIN/fullchain.pem"
        ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem \
               "$PROJECT_DIR/nginx/ssl/live/$DOMAIN/privkey.pem"

        log "SSL berhasil di-setup!"
    else
        warn "SSL certificate sudah ada, skip."
        # Pastikan symlink masih valid
        mkdir -p "$PROJECT_DIR/nginx/ssl/live/$DOMAIN"
        ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
               "$PROJECT_DIR/nginx/ssl/live/$DOMAIN/fullchain.pem" 2>/dev/null || true
        ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem \
               "$PROJECT_DIR/nginx/ssl/live/$DOMAIN/privkey.pem" 2>/dev/null || true
    fi
}

# =======================================================
# STEP 5: Build & Deploy containers
# =======================================================
deploy() {
    cd "$PROJECT_DIR"
    log "Membangun Docker images..."
    docker compose build --no-cache

    log "Menjalankan semua services..."
    docker compose up -d

    log "Menunggu database siap..."
    sleep 10

    log "Menjalankan Prisma migrations..."
    docker compose exec backend npx prisma migrate deploy

    log "Menjalankan database seeding (jika belum)..."
    docker compose exec backend npx prisma db seed || warn "Seeding dilewati (mungkin sudah pernah dijalankan)"
}

# =======================================================
# STEP 6: Verifikasi
# =======================================================
verify() {
    log "Mengecek status containers..."
    docker compose ps

    log "Mengecek health services..."
    sleep 5
    curl -s -o /dev/null -w "Frontend: %{http_code}\n" "https://$DOMAIN" || warn "Frontend belum siap"
    curl -s -o /dev/null -w "Backend:  %{http_code}\n" "https://api.$DOMAIN/api" || warn "Backend belum siap"
    curl -s -o /dev/null -w "Auth:     %{http_code}\n" "https://auth.$DOMAIN/auth/v1/health" || warn "Auth belum siap"
}

# =======================================================
# MAIN
# =======================================================
case "${1:-deploy}" in
    install)
        install_dependencies
        ;;
    ssl)
        setup_ssl
        ;;
    deploy)
        setup_repo
        setup_env
        deploy
        verify
        ;;
    full)
        install_dependencies
        setup_repo
        setup_env
        setup_ssl
        deploy
        verify
        ;;
    restart)
        cd "$PROJECT_DIR"
        docker compose restart
        ;;
    logs)
        cd "$PROJECT_DIR"
        docker compose logs -f "${2:-}"
        ;;
    migrate)
        cd "$PROJECT_DIR"
        docker compose exec backend npx prisma migrate deploy
        ;;
    *)
        echo "Usage: $0 {full|install|ssl|deploy|restart|logs|migrate}"
        echo ""
        echo "  full      - Install semua (pertama kali deploy)"
        echo "  install   - Install Docker, Nginx, Certbot saja"
        echo "  ssl       - Setup SSL certificate saja"
        echo "  deploy    - Pull repo + build + jalankan containers"
        echo "  restart   - Restart semua containers"
        echo "  logs      - Lihat logs (opsional: nama service)"
        echo "  migrate   - Jalankan Prisma migrate deploy"
        ;;
esac

log "Selesai!"
