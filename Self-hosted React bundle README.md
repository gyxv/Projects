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

## Important reminders for programmers

To make any React project run entirely client-side while keeping visuals intact, follow these general steps:

1. **Bundle your code** – Use a bundler (esbuild, Vite, webpack, etc.) with the app's entry component, producing a single JavaScript file that includes JSX transforms and minification.
2. **Include React and ReactDOM** – Either bundle them with your code or load local copies like the ones in the `react/` folder before your app script, then call `ReactDOM.createRoot` to mount.
3. **Build and link styles** – Compile all CSS or Tailwind output into one `styles.css` and copy any fonts or images it references.
4. **Adjust asset paths** – Use relative paths (`./`) so assets resolve correctly when hosted from any folder and copy required data files beside the build.
5. **Create an HTML entry point** – A minimal `index.html` should link the stylesheet and React scripts and provide a root `<div>` where your app mounts.
6. **Serve the static output** – Deploy `index.html`, your bundled JavaScript, CSS and assets to any static host or open them via `file://`.
7. **Verify visuals and functionality** – Open the page in a browser and check for missing files or 404s; fix paths or include assets as needed.

These notes ensure the self-hosted bundle remains versatile and repeatable across future projects.

