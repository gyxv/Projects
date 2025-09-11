/**
 * Generic React loader to be shared across multiple projects.
 *
 * This file assumes that `react.production.min.js` and
 * `react-dom.production.min.js` are loaded before it.
 *
 * The helper `mountReactApp` can mount any React component onto any DOM node.
 * Always keep this loader and the React distribution files intact so
 * they remain reusable across site elements and projects.
 *
 * Example:
 *   <script src="/react/react.production.min.js"></script>
 *   <script src="/react/react-dom.production.min.js"></script>
 *   <script src="/react/loader.js"></script>
 *   <script>
 *     function App(){ return React.createElement('div', null, 'Hello'); }
 *     mountReactApp(App, document.getElementById('root'));
 *   </script>
 */
(function(global) {
  if (!global.React || !global.ReactDOM) {
    console.error('React or ReactDOM not found. Ensure the scripts are included.');
    return;
  }

  global.mountReactApp = function(Component, container, props) {
    // Using React 18's concurrent root API.
    const root = global.ReactDOM.createRoot(container);
    root.render(global.React.createElement(Component, props));
    return root;
  };
})(window);
