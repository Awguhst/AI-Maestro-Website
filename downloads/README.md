# Installer drop

For a local preview, put both built installers here, named exactly:

```
AIMaestro-Setup.exe
AIMaestro-Setup-CUDA.exe
```

Download buttons point at these stable names with the `download` attribute.
Replace the files after rebuilding and update the measured download and installed
sizes in `index.html` (`data-size` and `data-installed`).

The executables are git-ignored: GitHub rejects files over 100 MB, so a source commit
does not upload them. In the Docker image nginx redirects each download path to its
matching asset on the latest GitHub release of `Awguhst/AI-Maestro-Website` (see the
root README, "Deploy"). Publishing new downloads requires uploading both release
assets separately from pushing the website commit.

`assets/downloads.json` records the desktop source commit, file sizes, and SHA-256
checksums of the prepared installers. Regenerate those values whenever the files change.

If you rename the installer (for example to include the version,
`AIMaestro-Setup-0.1.0.exe`), update its links, JSON-LD `downloadUrl`, and visible
filename references in `index.html`, along with the nginx redirect and release asset.
Keep the standard and CUDA filenames distinct.

Serving note: some static hosts refuse to serve `.exe` by default, or serve it with a
`text/plain` content type. If a download opens as text instead of saving, set the MIME type to
`application/octet-stream` for `.exe` in your host's configuration.
