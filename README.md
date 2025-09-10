## Running the simulator

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open your browser to <http://localhost:3000>. The app redirects to `/brute-force` where the simulator lives.

The original static implementation has been preserved under `archive/index.html` for reference.

### Tailwind

The UI uses Tailwind CSS. The Next.js build step compiles the Tailwind classes automatically during `next dev` or `next build`.
