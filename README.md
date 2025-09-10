## Running the simulator

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open your browser to <http://localhost:3000/brute-force> to view the React UI.

A minimal `index.html` at the project root redirects to the simulator, while the original static implementation has been preserved under `archive/index.html` for reference.

### Tailwind and static demo

The UI uses Tailwind CSS. The Next.js build step compiles the Tailwind classes automatically.

If you only need a quick proof-of-concept without running a server, open `demo.html` in your browser. It loads React and Tailwind from CDNs and renders a tiny component entirely client side.
