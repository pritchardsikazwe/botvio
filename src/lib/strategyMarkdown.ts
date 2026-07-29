/* Lightweight markdown → HTML renderer for strategy / marketplace descriptions. */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (s: string) =>
  escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:)]|$)/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

/** Convert markdown-ish strategy copy into safe, well-structured HTML. */
export function renderStrategyMarkdown(text: string, skipTitle?: string): string {
  if (!text) return "";

  // Normalise: some records store everything on one line with " · ", "**", "•" and "---".
  const normalised = text
    .replace(/\r\n/g, "\n")
    .replace(/\s*---\s*/g, "\n\n---\n\n")
    .replace(/\s(#{2,4})\s/g, "\n\n$1 ")
    .replace(/\s•\s/g, "\n• ")
    .replace(/\s>\s/g, "\n> ")
    .replace(/(\S)\s(\d{1,2})\.\s(?=[A-Z])/g, "$1\n$2. ");

  const lines = normalised.split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const openList = (type: "ul" | "ol") => {
    if (listType !== type) {
      closeList();
      out.push(
        type === "ul"
          ? '<ul class="list-disc pl-5 space-y-1 my-3">'
          : '<ol class="list-decimal pl-5 space-y-1 my-3">'
      );
      listType = type;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushPara();
      closeList();
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushPara();
      closeList();
      out.push('<hr class="my-6 border-border" />');
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushPara();
      closeList();
      const plain = heading[2].replace(/\*\*/g, "").trim();
      if (skipTitle && plain.toLowerCase() === skipTitle.trim().toLowerCase()) continue;
      const level = Math.min(heading[1].length + 1, 4); // never emit a second h1
      const size = level === 2 ? "text-xl" : level === 3 ? "text-lg" : "text-base";
      out.push(`<h${level} class="${size} font-bold text-foreground mt-6 mb-2">${inline(plain)}</h${level}>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara();
      closeList();
      out.push(
        `<blockquote class="border-l-2 border-primary/50 pl-4 italic my-3">${inline(line.replace(/^>\s?/, ""))}</blockquote>`
      );
      continue;
    }

    const bullet = line.match(/^(?:[•\-*]|✅)\s+(.*)$/);
    if (bullet) {
      flushPara();
      openList("ul");
      const prefix = line.startsWith("✅") ? "✅ " : "";
      out.push(`<li>${prefix}${inline(bullet[1])}</li>`);
      continue;
    }

    const numbered = line.match(/^\d{1,2}[.)]\s+(.*)$/);
    if (numbered) {
      flushPara();
      openList("ol");
      out.push(`<li>${inline(numbered[1])}</li>`);
      continue;
    }

    closeList();
    para.push(line);
  }

  flushPara();
  closeList();
  return out.join("\n");
}

/** Plain-text excerpt for hero/summary areas and meta descriptions. */
export function strategyExcerpt(text: string, maxLength = 180): string {
  if (!text) return "";
  const plain = text
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/[#*`>]/g, "")
    .replace(/-{3,}/g, " ")
    .replace(/\s*[•]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : maxLength)}…`;
}
