export const NO_AUTOCORRECT_PROPS = {
  spellCheck: false,
  autoCorrect: "off",
  autoCapitalize: "off",
  autoComplete: "off",
  inputMode: "text" as const,
  // Browser extensions (Grammarly, LastPass, etc.) can hijack inputs and fight keystrokes.
  "data-gramm": "false",
  "data-gramm_editor": "false",
  "data-enable-grammarly": "false",
  "data-lpignore": "true",
} as const
