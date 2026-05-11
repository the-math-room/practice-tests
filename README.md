# Math Practice Tool

Vanilla JS starter for a client-side interactive math practice tool.

## Run locally

Because the app uses `fetch()` to load JSON files, serve the folder with a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Data model

- `data/problemTypes/index.json` lists reusable problem type files.
- `data/problemTypes/**.json` stores individual problem templates.
- `data/practiceSets/index.json` lists practice set files.
- `data/practiceSets/**.json` stores curated practice sets students can choose.

Template variables use double braces, for example:

```text
{{base}}
{{height}}
{{area}}
```

This avoids conflicts with LaTeX braces such as:

```text
\frac{1}{2}
\text{ square units}
```
