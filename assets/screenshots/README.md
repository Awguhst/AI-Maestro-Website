# Screenshot slots

Drop PNG files here with these exact names. Each slot on the page shows a technical
placeholder until the matching file exists — `js/app.js` swaps it out automatically,
so there is nothing to edit in the HTML.

| File              | Used in section        | Aspect | Suggested size | Should show |
|-------------------|------------------------|--------|----------------|-------------|
| `results.png`     | Features (FIG. 01)     | 16:9   | 2560 × 1440    | The results panel: confusion matrix, ROC/PR curve, feature importance |
| `molecule.png`    | Models & data (FIG. 02)| 4:3    | 1600 × 1200    | A molecule drawn from SMILES beside the dataset table |
| `canvas.png`      | The canvas (FIG. 03)   | 16:10  | 2560 × 1600    | The canvas with data → preprocessing → representation → split → model wired up |
| `training.png`    | The canvas (FIG. 04)   | 16:9   | 1920 × 1080    | A run in flight: training curve plus CPU/GPU usage |
| `leaderboard.png` | Export (FIG. 05)       | 16:9   | 1920 × 1080    | The leaderboard comparing several runs |

Notes:

- Images are cropped with `object-fit: cover`, anchored to the top. Keep the important
  content in the upper two-thirds.
- Capture on a dark app theme so the shots sit inside the page rather than glowing out of it.
- Keep each file under ~500 KB if you can (the page loads them lazily, but they are the
  heaviest thing on it).
- If you change a filename, update the matching `src` **and** the `.shot__ph-meta` line in
  `index.html` so the placeholder keeps telling the truth.
- `alt` text is already written for each slot. If a screenshot shows something different
  from the table above, rewrite its `alt` to match what is actually in the picture.
