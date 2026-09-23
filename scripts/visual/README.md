# Design QA: pixel-diff against the prototype

Renders the design prototype in `docs/` and the app's `/preview/*` screens
(same seed data, same interactions, same sizes) and pixel-diffs them.

```bash
npm run dev            # in another terminal
npm run visual:ref     # screenshot the prototype → .visual/ref
npm run visual:app     # screenshot the app       → .visual/app
npm run visual:diff    # report % mismatch per screen, diff images → .visual/diff
```

Helpers: `zoom.mjs` (stack a region of ref / app / diff, upscaled) and
`shift.mjs` (per-band best alignment — tells layout offsets from rasterisation).

Notes on matching the designer's render exactly:
- `ds-bundle-emulation.css` stands in for the design-system bundle the prototype
  links but the handoff omits (global border-box, line-height 1.5) — verified at
  0 px against the designer's own screenshot.
- The board puts frames on half-pixels and clips the 390px mobile app to 388px;
  the scripts correct for both so comparisons are like-for-like.
