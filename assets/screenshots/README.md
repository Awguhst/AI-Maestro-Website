# App screenshots

Captured from the current QML app on 2026-09-27. These are actual rendered app
frames, with measured local runs. No metrics or interface elements are drawn over
the captures. The screenshots retain their native colours and use WebP quality 92.

| File | Pixels | Content |
| --- | --- | --- |
| `overview.webp` | 2160 x 1440 | Completed random forest workflow and test metrics, retained for the social image only |
| `results.webp` | 2160 x 1440 | The same run, scrolled to diagnostic plots |
| `workflow.webp` | 2160 x 900 | Five connected nodes before training |
| `datasets.webp` | 2160 x 1350 | Project datasets and the built-in dataset catalog |
| `leaderboard.webp` | 2160 x 1080 | Three actual random forest runs in experiment history |
| `molecule.webp` | 1800 x 1200 | Six example SMILES structures in the molecule gallery |

The classification captures use the bundled Breast Cancer Wisconsin dataset.
The datasets page includes installed Iris, Wine, and Breast Cancer Wisconsin data.
They illustrate the interface, not a benchmark or a clinical claim.
The structure gallery uses a small example CSV without target values.

## Recreate

Run from the website folder with the desktop app's Python environment and its
ML dependencies installed (including scikit-learn and RDKit):

```
python scripts/capture_app.py --app "../ML Studio"
```

Add `--datasets-only` to refresh the datasets page without rerunning training.

The script uses `create_engine`, the production fonts and image providers, and
ordinary controller actions. It makes a new temporary project and app home. It
prints the demo project location for inspection and never loads personal projects.
Capture sizes are logical window dimensions at 1.5 pixel density.

After changing screenshots, regenerate the social image with Playwright installed:

```
node scripts/create_social.cjs
```

Set `BROWSER_CHANNEL` to `msedge` or `chrome` to use an installed browser.
This updates both `assets/og-image.svg` and `assets/og-image.png`.

Preview frames use the original aspect ratio with `object-fit: contain`. Each
image opens in a keyboard accessible dialog, or as a normal image link without
JavaScript. On narrow screens the dialog scrolls horizontally for readable detail.
