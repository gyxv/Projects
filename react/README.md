# Self-Hosted React

This directory provides a lightweight, self-hosted copy of the React libraries for use across multiple projects.

## Files

- `react.production.min.js` – the React core library.
- `react-dom.production.min.js` – the ReactDOM bindings for browser environments.
- `loader.js` – a small helper that exposes a generic `mountReactApp` function and ensures that the libraries remain usable for any number of components or entry points.

## Usage

Include the scripts in your HTML before your own code:

```html
<script src="/react/react.production.min.js"></script>
<script src="/react/react-dom.production.min.js"></script>
<script src="/react/loader.js"></script>
<script>
  function App() {
    return React.createElement('div', null, 'Hello from self\u2011hosted React');
  }
  mountReactApp(App, document.getElementById('root'));
</script>
```

Always preserve this directory structure and files to maintain compatibility for multiple site elements and future projects.
