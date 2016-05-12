var Docker = require('dockerode');
var docker = new Docker({socketPath: '/tmp/docker.sock'});

var streams = {};

var registerContainerStreams = function () {
  docker.listContainers(function (err, containers) {
    containers.forEach(function (containerInfo) {
      if (streams[containerInfo.Id] !== undefined) {
        return;
      }
      if(containerInfo.Id.substr(0,12) === process.env.HOSTNAME) {
        if(process.env.LOG_LEVEL === 'info') {
          console.warn('Skipping stream', containerInfo.Id, containerInfo.Names, 'because it matches hostname', process.env.HOSTNAME);
        }
        return;
      }
      docker.getContainer(containerInfo.Id).logs({stderr: true, stdout: true, follow: true, tail: 100}, function (err, stream) { 
        if (err) {
          console.error('docker-logs-mux:', 'we could not process the stream for', container.Id, container.Names);
          return;
        }
        console.log('docker-logs-mux:', 'Adding stream for', containerInfo.Id, containerInfo.Names)
        stream.on('data', function (buffer) {
          if (buffer.toString('utf8').trim() === '') return;
          var logMessage = containerInfo.Id.substr(0,12) + ' - ' + containerInfo.Names + ' : ' + buffer.toString('utf8');
          if (logMessage[logMessage.length - 1] !== '\n') logMessage += '\n';
          process.stdout.write(logMessage);
        });
        stream.on('end', function () {
          console.log('docker-logs-mux:', 'Stream for', containerInfo.Id, containerInfo.Names, 'has ended.');
          streams[containerInfo.Id] = undefined;
        })
        stream.on('close', function () {
          console.log('docker-logs-mux:', 'Stream for', containerInfo.Id, containerInfo.Names, 'has closed.');
          streams[containerInfo.Id] = undefined;
        });
        stream.on('error', function () {
          console.log('docker-logs-mux:', 'Stream for', containerInfo.Id, containerInfo.Names, 'has errored.');
          streams[containerInfo.Id] = undefined;
        });
        
        streams[containerInfo.Id] = stream;
      });
    });
  });  
}

setInterval(registerContainerStreams, 10 * 1000)
registerContainerStreams()