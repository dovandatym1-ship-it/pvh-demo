const rules = [
  {
    id: "UI_ENGLISH",
    re: /(?:>|(?:placeholder|aria-label|title)=["'])\s*(?:Dashboard|No data|Loading\.\.\.|Submit|Cancel|Export|Import|Reset password|Profile|Workflow)\s*(?:<|["'])/gi,
  },
  {
    // JSX text only. Skip braces/types so names such as snapshot.title are not UI copy.
    id: "UI_TECHNICAL",
    re: />[^<>{}]*(?:assigned_to\s*=|\bsnapshot\b|LEGACY_MOCK\b)[^<>{}]*</gi,
  },
  {
    // Ternary and presentational attribute string literals may render directly.
    id: "UI_TECHNICAL",
    re: /(?:\?\s*|(?:placeholder|aria-label|title|label|description|name|desc|text|message|help)\s*[:=]\s*)["'`][^"'`]*(?:assigned_to\s*=|\bsnapshot\b|LEGACY_MOCK\b)[^"'`]*["'`]/gi,
  },
  {
    id: "UI_AMPERSAND",
    re: />[^<>{}]*[À-ỹ][^<>{}]*\s&\s[^<>{}]*</g,
  },
];

export function scanVietnameseUiSource(source, path) {
  const findings = [];
  for (const { id, re } of rules) {
    re.lastIndex = 0;
    for (const match of source.matchAll(re)) {
      const line = source.slice(0, match.index).split("\n").length;
      findings.push({ file: path, line, rule: id, sample: match[0].slice(0, 130) });
    }
  }
  return findings;
}
