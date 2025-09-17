import { build } from "esbuild";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entryFile = path.resolve(__dirname, "../src/index.tsx");
const outdir = path.resolve(__dirname, "../dist");

await fs.promises.mkdir(outdir, { recursive: true });

await build({
  entryPoints: [entryFile],
  outfile: path.join(outdir, "timer.js"),
  bundle: true,
  format: "iife",
  target: ["es2017"],
  sourcemap: true,
  minify: true,
  external: ["react"],
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

console.log("Built timer bundle to", path.relative(process.cwd(), path.join(outdir, "timer.js")));
