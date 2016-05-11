var Docker = require('dockerode');
var docker = new Docker({socketPath: '/tmp/docker.sock'});

var streams = {};

var registerContainerStream = function () {
  docker.listContainers(function (err, containers) {
    containers.forEach(function (containerInfo) {
      docker.getContainer(containerInfo.Id).logs({stderr: true, stdout: true, follow: true, tail: 20}, function (err, stream) { 
        if (err) {
          console.error('docker-logs-mux:', 'we could not process the stream for', container.Id, container.Names);
          return;
        }
        if (streams[containerInfo.Id] !== undefined) return;
        
        stream.on('data', function (buffer) {
          if(containerInfo.Id.substr(0,12) !== process.env.HOSTNAME) {
            process.stdout.write(containerInfo.Id.substr(0,12) + ' - ' + containerInfo.Names + ' : ' + buffer );
          }
        });
        stream.on('end', function () {
          console.log('docker-logs-mux:', 'Stream for', containerInfo.Id, 'has ended.');
        })
        stream.on('close', function () {
          console.log('docker-logs-mux:', 'Stream for', containerInfo.Id, 'has closed.');
          streams[containerInfo.Id] = undefined;
        });
        stream.on('error', function () {
          console.log('docker-logs-mux:', 'Stream for', containerInfo.Id, 'has errored.');
          streams[containerInfo.Id] = undefined;
        });
        
        streams[containerInfo.Id] = stream;
      });
    });
  });  
}