# US Electricity Retail 2024 — EIA-861 analysis

Static website (no build step, no external dependencies) analysing 2024 U.S. utility bundled retail electricity sales from EIA Form 861 (Tables 1, 6, 7, 8, 9, 10).

- `index.html` — interactive dashboard (state price map, sector mix, state rankings, ownership, top utilities, use-vs-price scatter, price distribution, retail choice, sortable state table)
- `report.html` — one-page summary report (prints to a single Letter page via **Print / Save PDF**)
- `assets/data.js` — aggregated data derived from the spreadsheets
- `assets/charts.js`, `assets/app.js`, `assets/style.css` — charts, page logic, styles (light/dark theme)

## Publish on GitHub Pages
1. Create a new repository on GitHub (e.g. `electricity-2024`).
2. Upload the contents of this folder to the repository root (or `git init && git add . && git commit -m "Site" && git push`).
3. In the repo go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Notes on method
- Price = revenue ÷ sales (¢/kWh). State totals use Table 10 (includes short-form utilities and state adjustments); sector figures use Tables 6–9.
- Bundled share = bundled customers (Table 10, excluding behind-the-meter providers) ÷ all customers (Table 1).

Source: U.S. Energy Information Administration, Form EIA-861 (2024).
