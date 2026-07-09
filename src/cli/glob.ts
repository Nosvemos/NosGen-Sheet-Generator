const escapeRegexLiteral = (value: string) =>
  value.replace(/[\\^$+.[\]{}()|/]/g, "\\$&");

export function matchWildcard(pattern: string, str: string): boolean {
  const regex = new RegExp(
    "^" +
      escapeRegexLiteral(pattern)
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".") +
      "$"
  );
  return regex.test(str);
}
