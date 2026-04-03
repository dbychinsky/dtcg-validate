#!/usr/bin/env node

const path = require("node:path");
const { SCHEMA_VERSION, validateFile } = require("./index");

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printUsage() {
  console.log(`dtcg-validate <file.json> [more-files.json]
Example: npx dtcg-validate ./tokens-a.json ./tokens-b.json ./tokens-c.json`);
}

async function validateAndPrint(filePath) {
  try {
    const result = await validateFile(filePath);
    const label = path.basename(result.dataPath);

    if (result.valid) {
      console.log(
        colorize(
          "green",
          `${label} conforms to DTCG ${result.schemaVersion}`,
        ),
      );
      return true;
    }

    console.error(colorize("red", label));

    for (const error of result.errors) {
      console.error(colorize("red", error));
    }

    return false;
  } catch (error) {
    console.error(colorize("red", path.basename(filePath)));
    console.error(colorize("red", error.message));
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
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
