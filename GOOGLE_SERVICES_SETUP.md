# google-services.json (placeholder)

`app.json` expects `./google-services.json` in the project root. It is not committed here.

TODO (you):

1. Firebase console → Project settings → Your apps → Add app → Android.
2. Package name: the same value as `android.package` in `app.json` (replace `com.TODO.tuitionmanager` first).
3. Add the SHA-1 and SHA-256 fingerprints (see README → "SHA fingerprints").
4. Download `google-services.json` and put it next to `app.json`.

Native builds (`eas build`, `npx expo run:android`) fail until this file exists.
