# React Troubleshooting README

- Ensured the HTML loader mounted the bundle's default export so the React app could render.
- Added a lightweight `require` shim in the static page so scripts could resolve `react`, the JSX runtime, and `@emotion/is-prop-valid` from globals.
- Switched the simulation to share a globally supplied React instance and replaced browser-specific imports to remove runtime type errors.
- Introduced TypeScript and build tooling to compile and bundle the simulation cleanly without embedding its own React copy.
- Exposed the simulation component globally and converted the source to `.tsx` to preserve type annotations.
- Bundled the app with a self-hosted React/ReactDOM setup and created a static HTML page that loads the simulation bundle.
- Added panel toggles and an expanded coverage chart so the simulation UI is fully interactive and easier to read.
