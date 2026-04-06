const { DTCG_VERSION, validate } = require("./lib/dtcg-validator");
const { readJson } = require("./lib/read-json");

/**
 * Reads a JSON file, validates it against the DTCG schemas,
 * and returns the result together with the absolute file path.
 *
 * @param {string} dataPath - Path to the JSON file being validated.
 * @returns {Promise<{valid: boolean, errors: Array<import("ajv").ErrorObject & { schemaName: "format"|"resolver" }>, schemaName?: "format"|"resolver", schemaVersion: string, dataPath: string}>} Validation result.
 */
async function validateFile(dataPath) {
  if (!dataPath) {
    throw new Error("Не указан путь к JSON-файлу.");
  }

  const dataFile = await readJson(dataPath);
  const result = validate(dataFile.value);

  return {
    ...result,
    dataPath: dataFile.path,
  };
}

module.exports = {
  DTCG_VERSION,
  validate,
  validateFile,
};
