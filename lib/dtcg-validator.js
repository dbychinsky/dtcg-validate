const fs = require("node:fs");
const path = require("node:path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const DTCG_VERSION = "2025.10";
const SCHEMA_DIR = path.join(__dirname, "..", "schemas", DTCG_VERSION);
const FORMAT_SCHEMA = require("../schemas/2025.10/format.json");
const RESOLVER_SCHEMA = require("../schemas/2025.10/resolver.json");

/**
 * Рекурсивно собирает все JSON-схемы из каталога DTCG.
 *
 * @param {string} dirPath - Корневой каталог со схемами.
 * @returns {string[]} Абсолютные пути к JSON-файлам.
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
 * Создает Ajv и регистрирует в нем все встроенные DTCG-схемы.
 *
 * @returns {Ajv} Настроенный экземпляр Ajv.
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
 * Валидирует данные по одной схеме и помечает ошибки именем схемы.
 *
 * @param {"format"|"resolver"} schemaName - Имя схемы для проверки.
 * @param {unknown} data - Данные для валидации.
 * @returns {{valid: boolean, errors: Array<import("ajv").ErrorObject & { schemaName: "format"|"resolver" }>, schemaName: "format"|"resolver"}} Результат валидации.
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
 * Валидирует данные по схемам format и resolver.
 *
 * Если данные проходят хотя бы по одной схеме, возвращается успешный результат.
 * Если не проходят ни по одной, возвращается общий список ошибок из обеих схем.
 *
 * @param {unknown} data - Данные для валидации.
 * @returns {{valid: boolean, errors: Array<import("ajv").ErrorObject & { schemaName: "format"|"resolver" }>, schemaName?: "format"|"resolver", schemaVersion: string}} Результат валидации.
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
