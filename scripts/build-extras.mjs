import { build } from "esbuild";
import path from "path";

const buildDir = "build";

export async function main() {
  await build({
    entryPoints: ["src/modules/injectScript.ts"],
    bundle: true,
    outfile: path.join(
      buildDir,
      "addon/chrome/content/scripts/injectScript.js",
    ),
    target: ["firefox102"],
  }).catch(() => exit(1));
}
