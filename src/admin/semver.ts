/** Core SemVer: MAJOR.MINOR.PATCH with optional pre-release / build suffix. */
const SEMVER_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$/;

export function isValidSemver(value: string): boolean {
  return SEMVER_PATTERN.test(value.trim());
}
