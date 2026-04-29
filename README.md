# SSH Config Generator

A static SvelteKit app for generating SSH config snippets for Linux HPC reverse SSH workflows. Cluster-specific values live in user-provided remote profiles, not in the app code.

The UI is built with SvelteKit, Tailwind CSS, Flowbite Svelte, and Lucide icons.

## Developing

Install dependencies and start the local server:

```sh
bun install
bun run dev
```

## Validating

```sh
bun run check
bun run lint
bun run test
bun run build
```

## Remote Profiles

Remote profiles can be YAML or JSON. A minimal YAML profile looks like:

```yaml
profileVersion: 1
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
```

## Building

Create a static production build:

```sh
bun run build
```

Set `BASE_PATH` for GitHub Pages project sites:

```sh
BASE_PATH=/ssh-confgen bun run build
```
