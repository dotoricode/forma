# VS Code palette mapping

Forma's light and dark color modes are based on VS Code's built-in Light+
and Dark+ themes. This gives technical artifacts a familiar working-surface
palette without making them look like an editor clone.

## Sources

The source package is the MIT-licensed `theme-defaults` extension in
`microsoft/vscode`.

- `extensions/theme-defaults/themes/light_plus.json`
- `extensions/theme-defaults/themes/dark_plus.json`
- VS Code workbench color registrations for editor, widget, selection,
  focus, chart, warning, error, and information colors

Light+/Dark+ provide syntax-series hues. Their `uiTheme` values (`vs` and
`vs-dark`) select the workbench surface defaults. Forma records both in
`src/design/tokens.ts`; rendered HTML does not load VS Code or make a
network request.

## Semantic mapping

| Forma role | Light+ source | Dark+ source |
|---|---:|---:|
| canvas | editor background `#FFFFFF` | editor background `#1E1E1E` |
| surface | editor widget `#F3F3F3` | editor widget `#252526` |
| raised surface | list hover `#F0F0F0` | list hover `#2A2D2E` |
| text | editor foreground `#333333` | workbench foreground `#CCCCCC` |
| muted text | workbench foreground `#616161` | inlay/muted `#969696` |
| accent | VS Code blue `#007ACC` | text link `#3794FF` |
| info | editor info `#0063D3` | editor info `#59A4F9` |
| danger | editor error `#E51400` | editor error `#F14C4C` |
| warning | editor warning `#BF8803` | editor warning `#CCA700` |
| success | chart green `#388A34` | chart green `#89D185` |

Small status text uses a darker or lighter step where the chart color alone
does not meet WCAG AA. This is an accessibility derivation from the source
palette, not a new decorative hue.

## Data series

Charts rotate through six Light+/Dark+ syntax and chart colors. The semantic
names are `--color-chart-1` through `--color-chart-6`; CSS never names a
series "blue" or "purple", so a visual can change mode without changing
meaning.

| Series | Light+ | Dark+ |
|---|---:|---:|
| 1 | `#0070C1` | `#4FC1FF` |
| 2 | `#267F99` | `#4EC9B0` |
| 3 | `#795E26` | `#DCDCAA` |
| 4 | `#AF00DB` | `#C586C0` |
| 5 | `#A31515` | `#CE9178` |
| 6 | `#388A34` | `#89D185` |
