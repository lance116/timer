# Timer

Life Timer is a Manifest V3 Chrome extension that replaces the new tab page with
a live life countdown. Set a birth date and target lifespan from the extension
popup, and every new tab shows the remaining years to twelve decimal places
alongside tangible counts for days, weeks, Mondays, weekends, and summers left.

## Install locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository folder.

Settings are saved with `chrome.storage.local`, so the countdown remains
configured across new tabs and browser restarts.

## Prepare Web Store package

Generate icons and listing assets:

```sh
python3 scripts/generate_store_assets.py
```

Create the upload zip:

```sh
./scripts/package_extension.sh
```

The generated Chrome Web Store upload package is written to `dist/`. Store
listing copy is in `STORE_LISTING.md`, required listing images are in
`store-assets/`, and the privacy policy is in `PRIVACY.md`.
