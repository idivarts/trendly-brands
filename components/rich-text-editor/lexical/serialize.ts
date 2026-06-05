/**
 * Bridges Lexical's node tree to the exact HTML vocabulary understood by the
 * native `react-native-enriched` editor, so web ⇄ native round-trips are
 * lossless with no entity-decoding or tag-remapping hacks.
 *
 * Native vocabulary (confirmed from the native parser source):
 *  - blocks:  <p> <h1> <h2> <h3> <blockquote> <codeblock> <ul>/<ol> + <li>
 *  - inline:  <b> <i> <u> <s> <code> <a href> <img src width height/>, <br>
 *  - escaping: only & < >  (numeric entities for non-ASCII are also accepted on
 *    import, but emitting literal UTF-8 is equivalent and cleaner)
 *  - whole document wrapped in <html>…</html> (added by ensureEnrichedHtml)
 */

import { $generateNodesFromDOM } from "@lexical/html";
import { $isCodeNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import { $isListNode } from "@lexical/list";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import {
    $createParagraphNode,
    $getRoot,
    $isElementNode,
    $isLineBreakNode,
    $isParagraphNode,
    $isTextNode,
    type ElementNode,
    type LexicalEditor,
    type LexicalNode,
} from "lexical";
import { $createImageNode, $isImageNode } from "./ImageNode";

// ── escaping ────────────────────────────────────────────────────────────────

function escapeText(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
    return escapeText(value).replace(/"/g, "&quot;");
}

// ── export: Lexical node tree → native-vocabulary HTML ──────────────────────

function serializeText(node: LexicalNode): string {
    if (!$isTextNode(node)) return "";
    let out = escapeText(node.getTextContent());
    if (out === "") return "";
    // Innermost → outermost. Order is irrelevant to rendering; kept stable.
    if (node.hasFormat("code")) out = `<code>${out}</code>`;
    if (node.hasFormat("strikethrough")) out = `<s>${out}</s>`;
    if (node.hasFormat("underline")) out = `<u>${out}</u>`;
    if (node.hasFormat("italic")) out = `<i>${out}</i>`;
    if (node.hasFormat("bold")) out = `<b>${out}</b>`;
    return out;
}

function serializeInline(node: LexicalNode): string {
    if ($isTextNode(node)) return serializeText(node);
    if ($isLineBreakNode(node)) return "<br>";
    if ($isImageNode(node)) {
        const w = node.getWidth() ? ` width="${node.getWidth()}"` : "";
        const h = node.getHeight() ? ` height="${node.getHeight()}"` : "";
        return `<img src="${escapeAttr(node.getSrc())}"${w}${h}/>`;
    }
    if ($isLinkNode(node)) {
        return `<a href="${escapeAttr(node.getURL())}">${serializeChildren(node)}</a>`;
    }
    if ($isElementNode(node)) return serializeChildren(node);
    return "";
}

function serializeChildren(node: ElementNode): string {
    return node.getChildren().map(serializeInline).join("");
}

function clampHeading(tag: string): string {
    return tag === "h1" || tag === "h2" || tag === "h3" ? tag : "h3";
}

function serializeBlock(node: LexicalNode): string {
    if ($isHeadingNode(node)) {
        const tag = clampHeading(node.getTag());
        return `<${tag}>${serializeChildren(node)}</${tag}>`;
    }
    if ($isQuoteNode(node)) {
        return `<blockquote>${serializeChildren(node)}</blockquote>`;
    }
    if ($isCodeNode(node)) {
        return `<codeblock>${escapeText(node.getTextContent())}</codeblock>`;
    }
    if ($isListNode(node)) {
        const tag = node.getListType() === "number" ? "ol" : "ul";
        const items = node
            .getChildren()
            .filter($isElementNode)
            .map((li) => `<li>${serializeChildren(li)}</li>`)
            .join("");
        return `<${tag}>${items}</${tag}>`;
    }
    if ($isElementNode(node)) {
        return `<p>${serializeChildren(node)}</p>`;
    }
    return "";
}

/**
 * Serializes the current editor state to native-vocabulary inner HTML (no
 * `<html>` wrapper — that is added by `ensureEnrichedHtml`). Must run inside an
 * `editorState.read(...)` / `editor.update(...)` context. Returns "" for an
 * empty document so the placeholder shows cleanly.
 */
export function $serializeToEnrichedInner(): string {
    const blocks = $getRoot()
        .getChildren()
        .map(serializeBlock)
        .filter((s) => s !== "");
    if (blocks.length === 0) return "";
    if (blocks.length === 1 && blocks[0] === "<p></p>") return "";
    return blocks.join("\n");
}

// ── import: native-vocabulary HTML → Lexical node tree ──────────────────────

/** Removes an outer `<html>…</html>` wrapper, returning the inner markup. */
function stripHtmlWrapper(html: string): string {
    const trimmed = html.trim();
    const match = trimmed.match(/^<html>([\s\S]*)<\/html>$/i);
    return (match ? match[1] : trimmed).trim();
}

/**
 * Replaces the editor's content with nodes parsed from native-vocabulary HTML.
 * Must run inside an `editor.update(...)` context.
 *
 * `<codeblock>` is non-standard, so it is rewritten to `<pre>` for the DOM
 * parser (Lexical's CodeNode imports `<pre>`). Legacy `<strong>`/`<em>`/etc.
 * are handled natively by the default node importers.
 */
export function $setEditorContentFromHtml(editor: LexicalEditor, html: string): void {
    const root = $getRoot();
    root.clear();

    const inner = stripHtmlWrapper(html || "");
    if (!inner) {
        root.append($createParagraphNode());
        return;
    }

    const prepared = inner
        .replace(/<codeblock>/gi, "<pre>")
        .replace(/<\/codeblock>/gi, "</pre>");

    const dom = new DOMParser().parseFromString(`<body>${prepared}</body>`, "text/html");
    const nodes = $generateNodesFromDOM(editor, dom);

    // Append block nodes directly; group runs of inline/decorator nodes that the
    // parser left at the top level into a single paragraph each.
    let inlineBucket: LexicalNode[] = [];
    const flush = () => {
        if (inlineBucket.length === 0) return;
        const p = $createParagraphNode();
        inlineBucket.forEach((n) => p.append(n));
        root.append(p);
        inlineBucket = [];
    };

    for (const node of nodes) {
        if ($isElementNode(node) && !node.isInline()) {
            flush();
            root.append(node);
        } else {
            inlineBucket.push(node);
        }
    }
    flush();

    if (root.getChildrenSize() === 0) {
        root.append($createParagraphNode());
    }
}

// Re-export so the editor can build image nodes without a second import path.
export { $createImageNode, $isParagraphNode };
