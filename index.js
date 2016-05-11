var Docker = require('dockerode');
var docker = new Docker({socketPath: '/tmp/docker.sock'});

docker.listContainers(function (err, containers) {
  containers.forEach(function (containerInfo) {
    docker.getContainer(containerInfo.Id).logs(console.log);
  });
});
