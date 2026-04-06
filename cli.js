#!/usr/bin/env node

const path = require("node:path");
const { DTCG_VERSION, validateFile } = require("./index");

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

/**
 * Оборачивает текст в ANSI-последовательность цвета.
 *
 * @param {"red"|"green"} color - Имя цвета из локальной палитры.
 * @param {string} text - Текст для окрашивания.
 * @returns {string} Окрашенный текст.
 */
function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Печатает справку по использованию CLI.
 *
 * @returns {void}
 */
function printUsage() {
  console.log(`dtcg-validate <file.json> [more-files.json]
Example: npx dtcg-validate ./tokens.json`);
}

/**
 * Форматирует одну ошибку Ajv для вывода в CLI.
 *
 * @param {import("ajv").ErrorObject & { schemaName?: string }} error - Ошибка валидации Ajv.
 * @param {number} index - Порядковый номер ошибки.
 * @returns {string} Читаемое сообщение об ошибке.
 */
function formatError(error, index) {
  const instancePath = error.instancePath || "/";
  const keyword = error.keyword ? ` (${error.keyword})` : "";
  const schemaLabel = error.schemaName ? `[${error.schemaName}] ` : "";
  return `${index + 1}. ${schemaLabel}${instancePath}${keyword}: ${error.message}`;
}

/**
 * Валидирует файл и печатает результат в консоль.
 *
 * @param {string} filePath - Путь к проверяемому файлу.
 * @returns {Promise<boolean>} `true`, если файл валиден.
 */
async function validateAndPrint(filePath) {
  try {
    const result = await validateFile(filePath);
    const label = path.basename(result.dataPath);

    if (result.valid) {
      console.log(
        colorize(
          "green",
          `${label} is valid against DTCG ${DTCG_VERSION} ${result.schemaName}`,
        ),
      );
      return true;
    }

    console.error(colorize("red", label));

    for (const [index, error] of result.errors.entries()) {
      console.error(colorize("red", formatError(error, index)));
    }

    return false;
  } catch (error) {
    console.error(colorize("red", path.basename(filePath)));
    console.error(colorize("red", error.message));
    return false;
  }
}

/**
 * Запускает CLI.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const invalidOption = args.find((arg) => arg.startsWith("-"));

  if (invalidOption) {
    console.error(colorize("red", `Unknown option "${invalidOption}".`));
    printUsage();
    process.exit(1);
  }

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  let allValid = true;

  for (const filePath of args) {
    const isValid = await validateAndPrint(filePath);
    allValid = allValid && isValid;
    console.log("-----");
  }

  process.exit(allValid ? 0 : 1);
}

main();
