import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const entryFile = resolve(projectRoot, "src/morse-code/index.tsx");
const outfile = resolve(projectRoot, "dist/morse-code/app.js");

mkdirSync(dirname(outfile), { recursive: true });

const externalReactPlugin = {
  name: "external-react",
  setup(buildInstance) {
    const shim = (globalName) => ({
      contents: `module.exports = window.${globalName};`,
      loader: "js",
    });

    buildInstance.onResolve({ filter: /^react$/ }, () => ({ path: "react-shim", namespace: "external-react" }));
    buildInstance.onResolve({ filter: /^react-dom$/ }, () => ({ path: "react-dom-shim", namespace: "external-react" }));
    buildInstance.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: "react-dom-client-shim", namespace: "external-react" }));

    buildInstance.onLoad({ filter: /^react-shim$/, namespace: "external-react" }, () => shim("React"));
    buildInstance.onLoad({ filter: /^react-dom-shim$/, namespace: "external-react" }, () => shim("ReactDOM"));
    buildInstance.onLoad({ filter: /^react-dom-client-shim$/, namespace: "external-react" }, () => shim("ReactDOM"));
  },
};

await build({
  entryPoints: [entryFile],
  bundle: true,
  outfile,
  format: "iife",
  target: ["es2018"],
  minify: true,
  sourcemap: false,
  jsx: "automatic",
  plugins: [externalReactPlugin],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
