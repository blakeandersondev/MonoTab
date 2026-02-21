# Mono Tab

Mono Tab is a minimalist new tab page for Chrome that combines a speed dial grid, search, and lightweight settings.

## Features
- Customizable speed dial with site names and icons
- Search with multiple engines
- Light/dark themes
- Per-site custom icon upload or URL

## Install (Developer Mode)
1. Open `chrome://extensions` in Chrome.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this project folder.

## Usage
- Click a dial to open the site in the current tab.
- Use the gear button to add sites and configure display options.
- Switch search engines from the dropdown or settings.

## Development
- Entry page: `newtab.html`
- Source modules: `src/`

## Privacy
Mono Tab uses Google’s favicon service to fetch default icons based on domain names. If you prefer, upload a custom icon in settings.

## License
MIT. See `LICENSE`.
