#!/usr/bin/env bash
# 一键为「听见·步量澳门」配置 域名 + Nginx + Let's Encrypt HTTPS
# 用法： sudo bash ~/setup_https.sh 你的域名.com
set -e
DOMAIN="$1"
[ -z "$DOMAIN" ] && { echo "用法: sudo bash ~/setup_https.sh 你的域名.com"; exit 1; }

echo "==> 安装 Nginx + certbot"
apt-get update && apt-get install -y nginx certbot python3-certbot-nginx

echo "==> 写入 Nginx 配置（反代到本机 8080）"
cat > /etc/nginx/sites-available/tingjian-macau <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
ln -sf /etc/nginx/sites-available/tingjian-macau /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> 申请 Let's Encrypt 证书（自动配置 HTTPS 并续期）"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect

echo "✅ 完成！请访问 https://$DOMAIN"
