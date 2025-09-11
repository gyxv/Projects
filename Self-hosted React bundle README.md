# Self-hosted React bundle README

This repository hosts minified React and ReactDOM builds for embedding in projects without relying on external CDNs. It is designed to be flexible so many site elements or standalone projects can share the same copy.

## Features

- **Offline-friendly**: ships `react.production.min.js` and `react-dom.production.min.js` locally, avoiding third-party script blockers and network latency.
- **Version tracking**: React versions are recorded in `package.json` under `dependencies`. Update both these dependencies and the files in `react/` together to keep versions in sync.
- **Reusable loader**: `react/loader.js` exposes a `mountReactApp` helper that mounts any component into a specified DOM node, enabling multiple independent widgets on a page.

## Usage

1. Include the scripts before your own code:

```html
<script src="/react/react.production.min.js"></script>
<script src="/react/react-dom.production.min.js"></script>
<script src="/react/loader.js"></script>
```

2. Define your component and mount it:

```html
<script>
  function App() {
    return React.createElement('div', null, 'Hello from self-hosted React');
  }
  mountReactApp(App, document.getElementById('root'));
</script>
```

## Maintenance notes

- Preserve the `react/` directory structure so other projects can reliably reference these files.
- When upgrading React, download new production builds for both libraries and update the versions in `package.json` accordingly.
- The bundled files are production builds; avoid mixing them with development or unminified versions.

