const { DTCG_VERSION, validate } = require("./lib/dtcg-validator");
const { readJson } = require("./lib/read-json");

/**
 * Читает JSON-файл, валидирует его по DTCG-схемам
 * и возвращает результат вместе с абсолютным путем к файлу.
 *
 * @param {string} dataPath - Путь к проверяемому JSON-файлу.
 * @returns {Promise<{valid: boolean, errors: Array<import("ajv").ErrorObject & { schemaName: "format"|"resolver" }>, schemaName?: "format"|"resolver", schemaVersion: string, dataPath: string}>} Результат валидации.
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
