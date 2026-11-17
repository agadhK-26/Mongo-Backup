FROM docker.io/library/node:20-bookworm-slim

# install mongodump / mongorestore (x86_64 PC / RHEL lab VM)
RUN apt-get update && apt-get install -y curl ca-certificates \
 && curl -fsSL -o /tmp/tools.deb https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.9.4.deb \
 && apt-get install -y /tmp/tools.deb \
 && rm -rf /tmp/tools.deb /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY server.js .

RUN mkdir -p /backups
VOLUME /backups
EXPOSE 5000
CMD ["node", "server.js"]