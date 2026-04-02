const REDACTION_PATTERNS: RegExp[] = [
  /(api[_-]?key\s*[:=]\s*)([\"']?)[a-z0-9_\-]{12,}([\"']?)/gi,
  /(password\s*[:=]\s*)([\"']?)[^\s\"']{6,}([\"']?)/gi,
  /(token\s*[:=]\s*)([\"']?)[a-z0-9_\-.]{12,}([\"']?)/gi,
  /(sk-[a-z0-9]{16,})/gi
];

export function redactSecrets(input: string): string {
  return REDACTION_PATTERNS.reduce((text, pattern) => text.replace(pattern, (_match, prefix = "", quoteA = "", quoteB = "") => `${prefix}${quoteA}[REDACTED]${quoteB}`), input);
}
