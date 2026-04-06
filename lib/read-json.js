const fsp = require("node:fs/promises");
const path = require("node:path");

/**
 * Читает JSON-файл, приводит путь к абсолютному и парсит содержимое.
 *
 * @param {string} filePath - Путь к JSON-файлу.
 * @returns {Promise<{path: string, value: unknown}>} Абсолютный путь и распарсенные данные.
 */
async function readJson(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = await fsp.readFile(absolutePath, "utf8");

  try {
    return {
      path: absolutePath,
      value: JSON.parse(raw),
    };
  } catch (error) {
    throw new Error(`Файл содержит невалидный JSON: ${error.message}`);
  }
}

module.exports = {
  readJson,
};
