/**
 * Fusion Language — A custom page builder language that's a fusion of HTML, JSX, and Tailwind.
 *
 * Syntax Example:
 * <html lang="en">
 *   <body>
 *     <Heading level="h1" align="center">Welcome to Our School</Heading>
 *     <Paragraph align="center">We provide excellence in education.</Paragraph>
 *     <div Content=[{title: "Academics", body: "STEM curriculum"}] ClassName="bg-white pt-5">{CardBox}</div>
 *     <Button variant="outline" align="center">Learn More</Button>
 *     <Stats value="98.5%" label="Pass Rate" change="+3.4%" />
 *     <Progress value="75" label="Admissions Target" />
 *   </body>
 * </html>
 *
 * Converts to/from Block[] used by the page builder engine.
 */

// ── Types ────────────────────────────────────────────────────────────────────

type BlockType =
  | "heading" | "paragraph" | "image" | "button" | "divider" | "columns"
  | "spacer" | "video" | "list" | "quote" | "alert" | "card" | "badge"
  | "input" | "avatar" | "progress" | "stats" | "pdf"
  | "section" | "row" | "grid" | "tabs" | "accordion"

interface Block {
  id: string
  type: BlockType
  props: Record<string, string>
  x?: number
  y?: number
  customWidth?: number
  customHeight?: number
  isInline?: boolean
  isFreeform?: boolean
  marginTop?: number
  marginBottom?: number
  marginStart?: number
  marginEnd?: number
  horizontalBias?: number
  verticalBias?: number
  layoutWidth?: "wrap_content" | "match_parent"
  linkedTargetId?: string
  linkedSide?: "top" | "bottom" | "left" | "right"
  anchoredLeft?: boolean
  anchoredRight?: boolean
  anchoredTop?: boolean
  anchoredBottom?: boolean
  parentId?: string
  slotIndex?: number
}

// ── Tag ↔ BlockType mapping ──────────────────────────────────────────────────

const TAG_TO_TYPE: Record<string, BlockType> = {
  "Heading": "heading",
  "Paragraph": "paragraph",
  "Button": "button",
  "Image": "image",
  "Divider": "divider",
  "Columns": "columns",
  "Spacer": "spacer",
  "Video": "video",
  "List": "list",
  "Quote": "quote",
  "Alert": "alert",
  "CardBox": "card",
  "Card": "card",
  "Badge": "badge",
  "Input": "input",
  "Avatar": "avatar",
  "Progress": "progress",
  "Stats": "stats",
  "PDF": "pdf",
  "PDFViewer": "pdf",
  "Section": "section",
  "Row": "row",
  "Grid": "grid",
  "Tabs": "tabs",
  "TabsContainer": "tabs",
  "Accordion": "accordion",
}

const TYPE_TO_TAG: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image",
  divider: "Divider",
  columns: "Columns",
  spacer: "Spacer",
  video: "Video",
  list: "List",
  quote: "Quote",
  alert: "Alert",
  card: "CardBox",
  badge: "Badge",
  input: "Input",
  avatar: "Avatar",
  progress: "Progress",
  stats: "Stats",
  pdf: "PDFViewer",
  section: "Section",
  row: "Row",
  grid: "Grid",
  tabs: "Tabs",
  accordion: "Accordion",
}

// Which prop holds the "inner text" for each type (used for <Tag>inner text</Tag> shorthand)
const TEXT_PROP_KEY: Record<BlockType, string | null> = {
  heading: "text",
  paragraph: "text",
  button: "label",
  image: null,
  divider: null,
  columns: null,
  spacer: null,
  video: null,
  list: "items",
  quote: "text",
  alert: "text",
  card: null,
  badge: "label",
  input: null,
  avatar: null,
  progress: null,
  stats: null,
  pdf: null,
  section: null,
  row: null,
  grid: null,
  tabs: null,
  accordion: null,
}

// ── Default props for each block type ────────────────────────────────────────

const DEFAULT_PROPS: Record<BlockType, Record<string, string>> = {
  heading: { text: "New Heading", level: "h2", align: "left" },
  paragraph: { text: "Start writing here...", align: "left" },
  button: { label: "Click Me", variant: "default", align: "left" },
  pdf: { url: "", title: "Document.pdf" },
  badge: { label: "NEW FEATURE 2026", variant: "default" },
  input: { placeholder: "Enter your email address...", label: "Email Address" },
  avatar: { name: "Ankit Kumar", role: "Principal Architect" },
  progress: { value: "75", label: "Admissions Target" },
  stats: { value: "98.5%", label: "Graduation Pass Rate", change: "+3.4% vs last year" },
  image: { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800", alt: "School banner", rounded: "lg" },
  columns: { left: "Left column content", right: "Right column details", gap: "6" },
  divider: { spacing: "md" },
  spacer: { height: "40" },
  video: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", rounded: "lg" },
  list: { items: "Feature Item 1\nFeature Item 2\nFeature Item 3" },
  quote: { text: "Education is the most powerful weapon.", author: "Nelson Mandela" },
  alert: { text: "Important Notice: School admissions open!", variant: "info" },
  card: { title: "Academic Excellence", body: "Comprehensive curriculum designed for modern STEM." },
  section: { background: "default", padding: "lg", fullWidth: "false" },
  row: { columns: "3", gap: "6", col1: "Column 1 content", col2: "Column 2 content", col3: "Column 3 content" },
  grid: { columns: "3", rows: "2", gap: "4", items: "Grid Item 1\nGrid Item 2\nGrid Item 3\nGrid Item 4\nGrid Item 5\nGrid Item 6" },
  tabs: { tabs: "Overview\nFeatures\nPricing", tab1: "Overview content goes here with key highlights and introductory text.", tab2: "Feature details including responsive design, AI integration, and more.", tab3: "Flexible pricing plans for schools of all sizes." },
  accordion: { items: "What programs do you offer?\nHow to apply for admission?\nWhat are the school timings?", answer1: "We offer comprehensive STEM, Arts, Sports and Leadership programs with modern curriculum.", answer2: "Visit our admissions portal, fill the online form, and submit required documents.", answer3: "School operates from 8:00 AM to 3:30 PM, Monday through Saturday." },
}

// ── Shorthand Component Resolution ───────────────────────────────────────────
// Handles the <div Content=[...] ClassName="...">{CardBox}</div> syntax

// ── Shorthand Component Resolution ───────────────────────────────────────────
// Handles the <div Content=[...] ClassName="...">{CardBox}</div> syntax

function parseContentArray(raw: string): Record<string, string>[] {
  try {
    return JSON.parse(raw)
  } catch {
    // Relaxed parser for unquoted/relaxed JS syntax: [{title: academics, paragraph: test, progress: 90%}]
    const items: Record<string, string>[] = []
    const objectMatches = raw.match(/\{[^}]+\}/g) || []
    for (const objStr of objectMatches) {
      const item: Record<string, string> = {}
      // Match key: value pairs separated by commas or newlines
      const kvMatches = objStr.match(/(\w+)\s*:\s*([^,}]+)/g) || []
      for (const kv of kvMatches) {
        const parts = kv.split(":")
        const key = parts[0].trim()
        let val = parts.slice(1).join(":").trim()
        val = val.replace(/^["']|["']$/g, "") // strip quotes
        item[key] = val
      }
      if (Object.keys(item).length > 0) {
        items.push(item)
      }
    }
    return items
  }
}

// ── Parser: Fusion Code → Block[] ────────────────────────────────────────────

export function fusionToBlocks(code: string): Block[] {
  const blocks: Block[] = []

  // Strip outer <html> and <body> wrappers if present
  let inner = code
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .trim()

  if (!inner) return blocks

  // Match all top-level tags — self-closing and open/close pairs
  // Handles: <Tag attrs /> or <Tag attrs>content</Tag> or <div attrs>{Component}</div>
  const tagRegex = /<(\w+)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s>]+))?)*)\s*(?:\/>|>([\s\S]*?)<\/\1>)/gi
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(inner)) !== null) {
    const [, tagName, attrsStr, innerContent] = match

    // Skip structural wrappers
    if (["html", "body", "head", "meta", "title", "link", "script", "style"].includes(tagName.toLowerCase())) continue

    // Check if it's a <div Content=[...]>{Component}</div> shorthand
    const componentMatch = innerContent?.trim().match(/^\{(\w+)\}$/)
    if (tagName.toLowerCase() === "div" && componentMatch) {
      const componentName = componentMatch[1]
      const blockType = TAG_TO_TYPE[componentName]
      if (!blockType) continue

      // Parse Content=[...] attribute
      const contentMatch = attrsStr.match(/Content\s*=\s*\[([^\]]*)\]/i)
      const contentItems = contentMatch ? parseContentArray(`[${contentMatch[1]}]`) : []

      // Parse ClassName / className for Tailwind classes
      const classNameMatch = attrsStr.match(/(?:ClassName|className)\s*=\s*"([^"]*)"/i) || attrsStr.match(/(?:ClassName|className)\s*=\s*'([^']*)'/i)
      const divClassName = classNameMatch ? classNameMatch[1] : ""

      // Generate a block per content item, or one with merged attrs
      if (contentItems.length > 0) {
        for (const item of contentItems) {
          const props: Record<string, string> = { ...DEFAULT_PROPS[blockType] }
          if (divClassName) {
            props.className = divClassName
            props.ClassName = divClassName
          }
          for (const [k, v] of Object.entries(item)) {
            props[k] = String(v)
            if (k === "paragraph" && !item.body) {
              props.body = String(v)
            }
          }
          blocks.push(createBlock(blockType, props))
        }
      } else {
        // Parse inline attributes
        const attrs = parseAttributes(attrsStr)
        const props: Record<string, string> = { ...DEFAULT_PROPS[blockType], ...attrs }
        if (divClassName) {
          props.className = divClassName
          props.ClassName = divClassName
        }
        blocks.push(createBlock(blockType, props))
      }
      continue
    }

    // Standard component tag: <Heading level="h1">Text</Heading>
    const blockType = TAG_TO_TYPE[tagName]
    if (!blockType) continue

    const attrs = parseAttributes(attrsStr)
    const props: Record<string, string> = { ...DEFAULT_PROPS[blockType], ...attrs }

    // If there's inner text content and this type supports a text prop, set it
    const textKey = TEXT_PROP_KEY[blockType]
    if (textKey && innerContent?.trim() && !innerContent.trim().startsWith("<")) {
      props[textKey] = innerContent.trim()
    }

    blocks.push(createBlock(blockType, props))
  }

  return blocks
}

function createBlock(type: BlockType, props: Record<string, string>): Block {
  const isNaturallyInline = ["button", "badge", "avatar"].includes(type)
  return {
    id: crypto.randomUUID(),
    type,
    props,
    x: 0,
    y: 0,
    isFreeform: false,
    isInline: isNaturallyInline,
    horizontalBias: 50,
    verticalBias: 50,
    anchoredLeft: true,
    anchoredRight: true,
  }
}

function parseAttributes(attrString: string): Record<string, string> {
  const result: Record<string, string> = {}
  // Match key="value" or key='value' pairs
  const attrRegex = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  let m: RegExpExecArray | null
  while ((m = attrRegex.exec(attrString)) !== null) {
    const key = m[1]
    const val = m[2] ?? m[3] ?? ""
    if (key === "Content") continue
    if (key === "ClassName" || key === "className") {
      result["className"] = val
      result["ClassName"] = val
    } else {
      result[key] = val
    }
  }
  return result
}

// ── Serializer: Block[] → Fusion Code ────────────────────────────────────────

export function blocksToFusion(blocks: Block[]): string {
  if (blocks.length === 0) {
    return `<html lang="en">\n<body>\n  <!-- Empty page — add components below -->\n</body>\n</html>`
  }

  const lines: string[] = []
  lines.push(`<html lang="en">`)
  lines.push(`<body>`)

  for (const block of blocks) {
    const tag = TYPE_TO_TAG[block.type] || "Heading"
    const textKey = TEXT_PROP_KEY[block.type]
    const defaultP = DEFAULT_PROPS[block.type] || {}

    // Build attribute list (skip the text-content prop since that goes as inner text)
    const attrs: string[] = []
    for (const [key, value] of Object.entries(block.props)) {
      if (textKey && key === textKey) continue // Will go as inner text
      if (defaultP[key] === value) continue // Skip if same as default
      attrs.push(`${key}="${escapeAttr(value)}"`)
    }

    // Layout attributes (non-default values)
    if (block.customWidth) attrs.push(`width="${block.customWidth}"`)
    if (block.customHeight) attrs.push(`height="${block.customHeight}"`)
    if (block.isFreeform) attrs.push(`freeform="true"`)
    if (block.isInline === false) attrs.push(`inline="false"`)

    const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : ""

    if (textKey && block.props[textKey]) {
      const textContent = block.props[textKey]
      // For multi-line text (list items), use CDATA-like formatting
      if (textContent.includes("\n")) {
        lines.push(`  <${tag}${attrStr}>`)
        for (const line of textContent.split("\n")) {
          lines.push(`    ${line}`)
        }
        lines.push(`  </${tag}>`)
      } else {
        lines.push(`  <${tag}${attrStr}>${textContent}</${tag}>`)
      }
    } else {
      // Self-closing or use attribute-only form
      const propsAttrs = Object.entries(block.props)
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(" ")
      // For types with no text key, put all props as attributes
      const allAttrs = propsAttrs ? " " + propsAttrs : ""
      // Re-add layout attrs that aren't props
      const layoutAttrs: string[] = []
      if (block.customWidth) layoutAttrs.push(`width="${block.customWidth}"`)
      if (block.customHeight) layoutAttrs.push(`height="${block.customHeight}"`)
      if (block.isFreeform) layoutAttrs.push(`freeform="true"`)
      const layoutStr = layoutAttrs.length > 0 ? " " + layoutAttrs.join(" ") : ""
      lines.push(`  <${tag}${allAttrs}${layoutStr} />`)
    }
  }

  lines.push(`</body>`)
  lines.push(`</html>`)

  return lines.join("\n")
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// ── Monaco Language Definition Registration ──────────────────────────────────

export function registerFusionLanguage(monaco: typeof import("monaco-editor")) {
  // Register the language
  monaco.languages.register({ id: "fusion" })

  // Monarch tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider("fusion", {
    defaultToken: "",
    tokenPostfix: ".fusion",

    // Component tags
    componentTags: Object.keys(TAG_TO_TYPE),

    tokenizer: {
      root: [
        // Comments
        [/<!--/, "comment", "@comment"],

        // Self-closing tags
        [/(<)(\/?)(\w+)/, [
          { token: "delimiter.bracket" },
          { token: "delimiter.bracket" },
          {
            cases: {
              "@componentTags": "tag.component",
              "html|body|head|div|span|section|main|header|footer|nav|article": "tag.html",
              "@default": "tag",
            },
          },
        ]],

        // Closing bracket
        [/\/>/, "delimiter.bracket"],
        [/>/, "delimiter.bracket"],

        // Attributes
        [/(\w[\w-]*)(\s*=\s*)/, ["attribute.name", "delimiter"]],

        // Strings
        [/"[^"]*"/, "attribute.value"],
        [/'[^']*'/, "attribute.value"],

        // Content array brackets
        [/\[/, "delimiter.bracket", "@contentArray"],

        // Component shorthand {CardBox}
        [/\{(\w+)\}/, "tag.component.shorthand"],

        // Text content
        [/[^<{]+/, "text"],
      ],

      comment: [
        [/-->/, "comment", "@pop"],
        [/./, "comment"],
      ],

      contentArray: [
        [/\]/, "delimiter.bracket", "@pop"],
        [/\{/, "delimiter.bracket", "@contentObject"],
        [/,/, "delimiter"],
        [/./, ""],
      ],

      contentObject: [
        [/\}/, "delimiter.bracket", "@pop"],
        [/(\w+)\s*:/, "attribute.name"],
        [/"[^"]*"/, "string"],
        [/'[^']*'/, "string"],
        [/[^}"',]+/, "attribute.value"],
        [/,/, "delimiter"],
      ],
    },
  } as any)

  // Language configuration (brackets, auto-closing, etc.)
  monaco.languages.setLanguageConfiguration("fusion", {
    comments: {
      blockComment: ["<!--", "-->"],
    },
    brackets: [
      ["<", ">"],
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "<", close: ">" },
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: "<", close: ">" },
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    folding: {
      markers: {
        start: /^\s*<!--\s*region\b/,
        end: /^\s*<!--\s*endregion\b/,
      },
    },
  })

  // Autocomplete / Intellisense
  monaco.languages.registerCompletionItemProvider("fusion", {
    triggerCharacters: ["<", " ", "{"],
    provideCompletionItems: (model: import("monaco-editor").editor.ITextModel, position: import("monaco-editor").Position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const lineContent = model.getLineContent(position.lineNumber)
      const beforeCursor = lineContent.substring(0, position.column - 1)

      // Inside { } → suggest component names
      if (beforeCursor.match(/\{\s*$/)) {
        return {
          suggestions: Object.keys(TAG_TO_TYPE).map((tag) => ({
            label: tag,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: `${tag}}`,
            range,
            detail: `Component: ${TAG_TO_TYPE[tag]}`,
            documentation: `Insert {${tag}} component shorthand`,
          })),
        }
      }

      // After < → suggest component tags
      if (beforeCursor.match(/<\s*$/)) {
        const tagSuggestions = Object.keys(TAG_TO_TYPE).map((tag) => ({
          label: tag,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: `${tag} $0></${tag}>`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: `Page Builder: ${TAG_TO_TYPE[tag]}`,
          documentation: `<${tag}>...</${tag}> component`,
        }))

        // Add self-closing variants
        const selfClosing = ["Image", "Divider", "Spacer", "Video", "Avatar", "Progress", "Stats", "PDF", "PDFViewer"].map((tag) => ({
          label: `${tag} (self-closing)`,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: `${tag} $0 />`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: `Self-closing: ${TAG_TO_TYPE[tag]}`,
        }))

        return { suggestions: [...tagSuggestions, ...selfClosing] }
      }

      // Inside a tag → suggest attributes
      if (beforeCursor.match(/<\w+\s[^>]*$/)) {
        const attrs = [
          { label: "level", detail: "h1 | h2 | h3", insertText: 'level="$1"' },
          { label: "align", detail: "left | center | right", insertText: 'align="$1"' },
          { label: "variant", detail: "default | outline | ghost", insertText: 'variant="$1"' },
          { label: "src", detail: "Image URL", insertText: 'src="$1"' },
          { label: "alt", detail: "Alt text", insertText: 'alt="$1"' },
          { label: "url", detail: "Embed URL", insertText: 'url="$1"' },
          { label: "value", detail: "Number or text value", insertText: 'value="$1"' },
          { label: "label", detail: "Display label", insertText: 'label="$1"' },
          { label: "title", detail: "Title text", insertText: 'title="$1"' },
          { label: "body", detail: "Body text", insertText: 'body="$1"' },
          { label: "name", detail: "Name text", insertText: 'name="$1"' },
          { label: "role", detail: "Role / subtext", insertText: 'role="$1"' },
          { label: "change", detail: "Comparison text", insertText: 'change="$1"' },
          { label: "placeholder", detail: "Input placeholder", insertText: 'placeholder="$1"' },
          { label: "rounded", detail: "none | md | lg | full", insertText: 'rounded="$1"' },
          { label: "spacing", detail: "sm | md | lg", insertText: 'spacing="$1"' },
          { label: "height", detail: "Height in px", insertText: 'height="$1"' },
          { label: "width", detail: "Width in px", insertText: 'width="$1"' },
          { label: "Content", detail: "Structured data array", insertText: 'Content=[{$1}]' },
          { label: "ClassName", detail: "Tailwind CSS classes", insertText: 'ClassName="$1"' },
          { label: "author", detail: "Quote author", insertText: 'author="$1"' },
        ]

        return {
          suggestions: attrs.map((a) => ({
            label: a.label,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: a.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: a.detail,
          })),
        }
      }

      return { suggestions: [] }
    },
  })
}

// ── Fusion Theme for Monaco ──────────────────────────────────────────────────

export function registerFusionTheme(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("fusion-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "tag.component", foreground: "C678DD", fontStyle: "bold" },
      { token: "tag.component.shorthand", foreground: "E5C07B", fontStyle: "bold" },
      { token: "tag.html", foreground: "E06C75" },
      { token: "tag", foreground: "E06C75" },
      { token: "attribute.name", foreground: "D19A66" },
      { token: "attribute.value", foreground: "98C379" },
      { token: "delimiter.bracket", foreground: "ABB2BF" },
      { token: "delimiter", foreground: "ABB2BF" },
      { token: "comment", foreground: "5C6370", fontStyle: "italic" },
      { token: "string", foreground: "98C379" },
      { token: "text", foreground: "ABB2BF" },
    ],
    colors: {
      "editor.background": "#1a1b26",
      "editor.foreground": "#c0caf5",
      "editor.lineHighlightBackground": "#1f2233",
      "editorCursor.foreground": "#c0caf5",
      "editor.selectionBackground": "#33467c",
      "editor.inactiveSelectionBackground": "#292e42",
      "editorLineNumber.foreground": "#3b4261",
      "editorLineNumber.activeForeground": "#737aa2",
      "editorIndentGuide.background": "#292e42",
      "editorIndentGuide.activeBackground": "#3b4261",
      "editorBracketMatch.background": "#1a1b2600",
      "editorBracketMatch.border": "#7aa2f7",
      "editor.findMatchBackground": "#3d59a1",
      "editor.findMatchHighlightBackground": "#3d59a144",
      "editorSuggestWidget.background": "#1a1b26",
      "editorSuggestWidget.border": "#292e42",
      "editorSuggestWidget.selectedBackground": "#292e42",
      "minimap.background": "#1a1b26",
    },
  })

  monaco.editor.defineTheme("fusion-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "tag.component", foreground: "8250DF", fontStyle: "bold" },
      { token: "tag.component.shorthand", foreground: "953800", fontStyle: "bold" },
      { token: "tag.html", foreground: "CF222E" },
      { token: "tag", foreground: "CF222E" },
      { token: "attribute.name", foreground: "953800" },
      { token: "attribute.value", foreground: "116329" },
      { token: "delimiter.bracket", foreground: "57606A" },
      { token: "delimiter", foreground: "57606A" },
      { token: "comment", foreground: "8C959F", fontStyle: "italic" },
      { token: "string", foreground: "0A3069" },
      { token: "text", foreground: "1F2328" },
    ],
    colors: {
      "editor.background": "#FAFBFC",
      "editor.foreground": "#1F2328",
      "editor.lineHighlightBackground": "#F0F2F5",
      "editorCursor.foreground": "#1F2328",
      "editor.selectionBackground": "#B6D4FE",
      "editorLineNumber.foreground": "#8C959F",
      "editorLineNumber.activeForeground": "#1F2328",
      "editorIndentGuide.background": "#E8EAED",
      "minimap.background": "#FAFBFC",
    },
  })
}

// ── Snippet Templates ────────────────────────────────────────────────────────

export const FUSION_SNIPPETS = {
  "Hero Section": `<html lang="en">
<body>
  <Badge label="WELCOME 2026" />
  <Heading level="h1" align="center">Welcome to Vidya School</Heading>
  <Paragraph align="center">Excellence in education, innovation in learning.</Paragraph>
  <Button variant="default" align="center">Explore Now</Button>
  <Divider spacing="lg" />
</body>
</html>`,

  "Stats Dashboard": `<html lang="en">
<body>
  <Heading level="h2">School Performance</Heading>
  <Stats value="98.5%" label="Pass Rate" change="+3.4% vs last year" />
  <Stats value="1,240" label="Total Students" change="+12% enrollment" />
  <Stats value="45" label="Faculty Members" />
  <Progress value="90" label="Academic Target" />
  <Progress value="78" label="Sports Achievement" />
</body>
</html>`,

  "Cards Grid": `<html lang="en">
<body>
  <Heading level="h2" align="center">Our Programs</Heading>
  <Paragraph align="center">Discover what makes us different.</Paragraph>
  <div Content=[{title: "Academics", body: "World-class STEM curriculum with project-based learning."}, {title: "Arts & Culture", body: "Creative programs in music, theater, and visual arts."}, {title: "Athletics", body: "Championship-level sports training and facilities."}]>{CardBox}</div>
</body>
</html>`,

  "Contact Section": `<html lang="en">
<body>
  <Heading level="h2">Get in Touch</Heading>
  <Paragraph>We'd love to hear from you. Fill out the form below.</Paragraph>
  <Input label="Full Name" placeholder="Enter your name..." />
  <Input label="Email" placeholder="you@example.com" />
  <Button variant="default">Send Message</Button>
</body>
</html>`,

  "Full Page": `<html lang="en">
<body>
  <!-- Hero -->
  <Badge label="VIDYA SCHOOL 2026" />
  <Heading level="h1" align="center">Building Tomorrow's Leaders</Heading>
  <Paragraph align="center">Where tradition meets innovation in education excellence.</Paragraph>
  <Image src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800" alt="Campus" />
  <Button variant="default" align="center">Apply Now</Button>
  <Button variant="outline" align="center">Virtual Tour</Button>
  
  <Divider spacing="lg" />
  
  <!-- Stats -->
  <Heading level="h2" align="center">By the Numbers</Heading>
  <Stats value="98.5%" label="Pass Rate" change="+3.4%" />
  <Stats value="1,240" label="Students" change="+12%" />
  <Stats value="45" label="Faculty" />
  <Progress value="90" label="Academic Target" />
  
  <Divider spacing="lg" />
  
  <!-- Programs -->
  <Heading level="h2" align="center">Programs</Heading>
  <div Content=[{title: "STEM", body: "Cutting-edge science and tech curriculum"}, {title: "Arts", body: "Creative expression through multiple mediums"}, {title: "Sports", body: "Championship athletics program"}]>{CardBox}</div>
  
  <Divider spacing="md" />
  
  <!-- Testimonial -->
  <Quote text="Vidya School transformed my child's approach to learning completely." author="Parent, Class of 2025" />
  
  <!-- CTA -->
  <Alert text="Admissions for 2026-27 are now open! Apply before March 31st." variant="info" />
  <Button variant="default" align="center">Start Application</Button>
</body>
</html>`,
}
