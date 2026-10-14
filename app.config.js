/* global __dirname */
const { execFileSync } = require("node:child_process");
module.exports = ({ config }) => {
  let revision = process.env.EAS_BUILD_GIT_COMMIT_HASH;
  if (!/^[a-f0-9]{40}$/i.test(revision || "")) {
    try { revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: __dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
    catch { revision = "local"; }
  }
  return { ...config, extra: { ...config.extra, buildRevision: revision, buildLabel: "UI + privacy integration" } };
};
