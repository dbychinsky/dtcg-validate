const fs = require("node:fs");
const path = require("node:path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const DTCG_VERSION = "2025.10";
const SCHEMA_DIR = path.join(__dirname, "..", "schemas", DTCG_VERSION);
const FORMAT_SCHEMA = require("../schemas/2025.10/format.json");
const RESOLVER_SCHEMA = require("../schemas/2025.10/resolver.json");

/**
 * Recursively collects all JSON schemas from the DTCG directory.
 *
 * @param {string} dirPath - Root schema directory.
 * @returns {string[]} Absolute paths to JSON files.
 */
function getJsonFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return getJsonFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

/**
 * Creates Ajv and registers all bundled DTCG schemas in it.
 *
 * @returns {Ajv} Configured Ajv instance.
 */
function createAjv() {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  });

  addFormats(ajv);
  ajv.addFormat("json-pointer-uri-fragment", /^#(?:\/(?:[^~/]|~0|~1)*)*$/);

  const schemaPaths = getJsonFiles(SCHEMA_DIR);
  for (const schemaPath of schemaPaths) {
    ajv.addSchema(require(schemaPath));
  }

  return ajv;
}

const ajv = createAjv();
const validators = {
  format: ajv.getSchema(FORMAT_SCHEMA.$id) || ajv.compile(FORMAT_SCHEMA),
  resolver: ajv.getSchema(RESOLVER_SCHEMA.$id) || ajv.compile(RESOLVER_SCHEMA),
};

/**
 * Validates data against one schema and tags errors with the schema name.
 *
 * @param {"format"|"resolver"} schemaName - Schema name to validate against.
 * @param {unknown} data - Data to validate.
 * @returns {{valid: boolean, errors: Array<import("ajv").ErrorObject & { schemaName: "format"|"resolver" }>, schemaName: "format"|"resolver"}} Validation result.
 */
function validateWithSchema(schemaName, data) {
  const validateSchema = validators[schemaName];
  const valid = validateSchema(data);

  return {
    valid,
    errors: (validateSchema.errors || []).map((error) => ({
      ...error,
      schemaName,
    })),
    schemaName,
  };
}

/**
 * Validates data against the format and resolver schemas.
 *
 * If the data matches at least one schema, a successful result is returned.
 * If it matches neither schema, a combined list of errors from both is returned.
 *
 * @param {unknown} data - Data to validate.
 * @returns {{valid: boolean, errors: Array<import("ajv").ErrorObject & { schemaName: "format"|"resolver" }>, schemaName?: "format"|"resolver", schemaVersion: string}} Validation result.
 */
function validate(data) {
  const results = [
    validateWithSchema("format", data),
    validateWithSchema("resolver", data),
  ];

  const matchedResult = results.find((result) => result.valid);
  if (matchedResult) {
    return {
      ...matchedResult,
      schemaVersion: DTCG_VERSION,
    };
  }

  return {
    valid: false,
    errors: results.flatMap((result) => result.errors),
    schemaVersion: DTCG_VERSION,
  };
}

module.exports = {
  DTCG_VERSION,
  validate,
};
