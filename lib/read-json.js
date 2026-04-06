const fsp = require("node:fs/promises");
const path = require("node:path");

/**
 * Reads a JSON file, resolves it to an absolute path, and parses its contents.
 *
 * @param {string} filePath - Path to the JSON file.
 * @returns {Promise<{path: string, value: unknown}>} Absolute path and parsed data.
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
