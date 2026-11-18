## 📦 Public container images

Ready-to-run images, no build needed. Both registries hold the same backend and frontend images.

| Image | 🐳 Docker Hub | 🔴 Quay.io |
|---|---|---|
| **Backend** (Node + Express + mongodump) | [![Docker Hub](https://img.shields.io/badge/Docker%20Hub-backend-2496ED?style=flat-square&logo=docker&logoColor=white)](https://hub.docker.com/r/agadhk/mongo-backup-backend) | [![Quay.io](https://img.shields.io/badge/Quay.io-backend-40B4E5?style=flat-square&logo=redhat&logoColor=white)](https://quay.io/repository/agadhk/mongo-backup-backend) |
| **Frontend** (React + nginx) | [![Docker Hub](https://img.shields.io/badge/Docker%20Hub-frontend-2496ED?style=flat-square&logo=docker&logoColor=white)](https://hub.docker.com/r/agadhk/mongo-backup-frontend) | [![Quay.io](https://img.shields.io/badge/Quay.io-frontend-40B4E5?style=flat-square&logo=redhat&logoColor=white)](https://quay.io/repository/agadhk/mongo-backup-frontend) |
| **Database** | official `docker.io/library/mongo:7` | n/a |

**Pull from Docker Hub**

```bash
podman pull docker.io/agadhk/mongo-backup-backend:latest
podman pull docker.io/agadhk/mongo-backup-frontend:latest
podman pull docker.io/library/mongo:7