import * as esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/generated",
)

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files
  }

  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      walk(full, files)
    } else if (full.endsWith(".ts")) {
      files.push(full)
    }
  }

  return files
}

for (const file of walk(root)) {
  if (path.basename(file).includes(" ")) {
    fs.unlinkSync(file)
    continue
  }

  const result = await esbuild.transform(fs.readFileSync(file, "utf8"), {
    loader: "ts",
    format: "esm",
    target: "esnext",
  })
  fs.writeFileSync(file.replace(/\.ts$/, ".js"), result.code)
  fs.unlinkSync(file)
}

function walkJs(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      walkJs(full, files)
    } else if (full.endsWith(".js")) {
      files.push(full)
    }
  }
  return files
}

for (const file of walkJs(root)) {
  const source = fs.readFileSync(file, "utf8")
  const rewritten = source.replaceAll('.ts"', '.js"')
  if (rewritten !== source) {
    fs.writeFileSync(file, rewritten)
  }
}
