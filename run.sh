#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "== Removing old containers (volumes are kept) =="
podman rm -f frontend backend mongo 2>/dev/null || true

echo "== Network + volumes =="
podman network exists mernnet   || podman network create mernnet
podman volume  exists mongo-data  || podman volume create mongo-data
podman volume  exists backup-data || podman volume create backup-data

echo "== 1/3 MongoDB container =="
podman run -d --name mongo --network mernnet \
  -v mongo-data:/data/db:Z \
  docker.io/library/mongo:7

echo "== 2/3 Backend container =="
podman build -t backend ./backend
podman run -d --name backend --network mernnet \
  -v backup-data:/backups:Z \
  -e MONGO_URL=mongodb://mongo:27017 \
  -p 5000:5000 \
  localhost/backend

echo "== 3/3 Frontend container =="
podman build -t frontend ./frontend
podman run -d --name frontend --network mernnet \
  -p 8080:80 \
  localhost/frontend

echo
podman ps
echo
podman volume ls
echo
echo "Open http://localhost:8080"