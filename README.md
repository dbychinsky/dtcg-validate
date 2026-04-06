# dtcg-validate

Minimal CLI for validating JSON files against the bundled DTCG 2025.10 `format` and `resolver` schemas.

## Usage

```bash
npx dtcg-validate ./file.json
```

The validator automatically accepts both DTCG format files and resolver files.
If a file does not match either schema, the CLI prints errors from both.

## Structure

`cli.js` - command-line interface and output formatting.  
`index.js` - public API (`validate`, `validateFile`).  
`lib/read-json.js` - reading and parsing JSON files.  
`lib/dtcg-validator.js` - schema loading and in-memory validation logic.

Multiple files:

```bash
npx dtcg-validate ./file-a.json ./file-b.json
```

Help:

```bash
npx dtcg-validate --help
```

## Node API

```js
const { validateFile } = require("dtcg-validate");

const result = await validateFile("./file.json");

if (!result.valid) {
  console.log(result.errors);
}
```

## Notes

The `format` and `resolver` schemas and their referenced DTCG schemas are bundled with the package.

## License

MIT
