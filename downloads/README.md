# Installer drop

For a local preview, put the built installer here, named exactly:

```
AIMaestro-Setup.exe
```

Every download button on the site points at `downloads/AIMaestro-Setup.exe` with the
`download` attribute, so nothing needs editing when you replace the file.

The file is git-ignored: GitHub rejects files over 100 MB, so the deployed site does not
ship it. In the Docker image nginx redirects this path to the `AIMaestro-Setup.exe` asset of
the latest GitHub release of `Awguhst/AI-Maestro-Website` (see the root README, "Deploy").

If you rename the installer (for example to include the version,
`AIMaestro-Setup-0.1.0.exe`), search `index.html` for `AIMaestro-Setup.exe`: it appears
fourteen times. Five are the `href` on a download link and one is the JSON-LD
`downloadUrl` — those must all change. The other eight are visible text (the hero spec
strip, the system requirements `INSTALLER` row and its SmartScreen note, the download
button, the file plate, install step 01, the closing note, and the footer's download
column), and should change too so the page still names the file you ship.

Serving note: some static hosts refuse to serve `.exe` by default, or serve it with a
`text/plain` content type. If a download opens as text instead of saving, set the MIME type to
`application/octet-stream` for `.exe` in your host's configuration.
