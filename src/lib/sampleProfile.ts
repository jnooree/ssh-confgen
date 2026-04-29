export const sampleProfileYaml = `profileVersion: 1
displayName: Example HPC Profile
entryHosts:
  - alias: hpc-proxy
    hostName: proxy.example.edu
    port: 2222
  - alias: hpc-login
    hostName: login.example.edu
    port: 22
proxyHostAlias: hpc-proxy
defaultLoginAlias: hpc-login
remoteHostPatterns:
  - login*
  - compute*
  - gpu*
socket:
  directory: /shared/sockets
  template: ssh-{remoteUser}-{localUser}@{reverseHost}_{localSshPort}.sock
remote:
  platform: linux
  requires:
    - socat
    - openssh-client
features:
  x11Forwarding: true
  reverseSshViaUnixSocket: true
`;
