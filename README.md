# docker-log-mux

Multiplex docker container logs over this containers log stream.

```bash
docker rm -f docker-logs-mux; docker build -t docker-logs-mux ./ && docker run --log-driver=journald -d --name=docker-logs-mux -v=/var/run/docker.sock:/tmp/docker.sock docker-logs-mux node index.js
```