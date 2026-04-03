# dtcg-validate

CLI tool to validate JSON (DTCG) files using Ajv.

## Overview

`dtcg-validate` validates JSON files against **DTCG schema version 2025.10**.

* Uses Ajv for JSON Schema validation
* Supports DTCG format validation
* Supports validation of multiple files
* Works as CLI (local or via npx)

---

## Usage

### Run with npx (recommended)

```bash
npx dtcg-validate ./tokens.json
```

---

### Validate multiple files

You can pass multiple files separated by spaces:

```bash
npx dtcg-validate tokens1.json tokens2.json
```

---

### Install globally

```bash
npm install -g dtcg-validate
```

```bash
dtcg-validate ./tokens.json
```

---

### Local usage (development)

```bash
node ./cli.js ./tokens.json
```

---

## Example output

```text
tokens1.json
1. /color/teal/50 (additionalProperties): must NOT have additional properties
2. /color/teal/50/$value (type): must be object
3. /color/teal/50/$value (pattern): must match pattern "^\{[^${}.][^{}.]*(\.[^${}.][^{}.]*)*\}$"
4. /color/teal/50/$value (type): must be object
5. /color/teal/50/$value (oneOf): must match exactly one schema in oneOf
6. /color/teal/100/$value (pattern): must match pattern "^\{[^${}.][^{}.]*(\.[^${}.][^{}.]*)*\}$"
-----
tokens2.json conforms to DTCG 2025.10
-----
```

---

## Schema

This package uses:

```
DTCG Schema: 2025.10
```

---

## Tech

* Ajv (JSON Schema validator)
* ajv-formats

---

## License

MIT
