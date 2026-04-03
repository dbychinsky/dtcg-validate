const fs = require("node:fs/promises");
const path = require("node:path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const SCHEMA_VERSION = "2025.10";
const EMBEDDED_SCHEMA_PATH = path.join(
  __dirname,
  "schemas",
  SCHEMA_VERSION,
  "format.json",
);

let validatorPromise;

async function collectJsonFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(fullPath);
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        return [fullPath];
      }

      return [];
    }),
  );

  return nestedFiles.flat();
}

async function readJson(filePath, label) {
  const absolutePath = path.resolve(filePath);
  const raw = await fs.readFile(absolutePath, "utf8");

  try {
    return {
      absolutePath,
      value: JSON.parse(raw),
    };
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

async function registerRelatedSchemas(ajv, schemaFilePath) {
  const schemaDirectory = path.dirname(schemaFilePath);
  const schemaFiles = await collectJsonFiles(schemaDirectory);

  for (const filePath of schemaFiles) {
    if (path.resolve(filePath) === path.resolve(schemaFilePath)) {
      continue;
    }

    const { absolutePath, value } = await readJson(filePath, "Related schema file");
    const fileUrl = new URL(`file://${absolutePath.replace(/\\/g, "/")}`).href;

    ajv.addSchema(value, fileUrl);

    if (!value.$id) {
      ajv.addSchema(value, absolutePath);
    }
  }
}

function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error, index) => {
    const instancePath = error.instancePath || "/";
    const keyword = error.keyword ? ` (${error.keyword})` : "";
    return `${index + 1}. ${instancePath}${keyword}: ${error.message}`;
  });
}

async function createValidator() {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  });

  addFormats(ajv);

  const schemaFile = await readJson(EMBEDDED_SCHEMA_PATH, "Embedded schema file");
  await registerRelatedSchemas(ajv, schemaFile.absolutePath);

  try {
    return ajv.compile(schemaFile.value);
  } catch (error) {
    throw new Error(`Schema compilation failed: ${error.message}`);
  }
}

async function getValidator() {
  if (!validatorPromise) {
    validatorPromise = createValidator();
  }

  return validatorPromise;
}

async function validateFile(dataPath) {
  if (!dataPath) {
    throw new Error("JSON file path is required.");
  }

  const [validate, dataFile] = await Promise.all([
    getValidator(),
    readJson(dataPath, "JSON file"),
  ]);

  const valid = validate(dataFile.value);

  return {
    valid,
    dataPath: dataFile.absolutePath,
    schemaVersion: SCHEMA_VERSION,
    errors: formatAjvErrors(validate.errors),
  };
}

module.exports = {
  SCHEMA_VERSION,
  validateFile,
};
