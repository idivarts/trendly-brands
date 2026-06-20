/**
 * @jest-environment jsdom
 *
 * Round-trip tests for the Lexical ⇄ react-native-enriched serializer:
 * import native-vocabulary HTML into a headless Lexical editor, export it back,
 * and assert the output matches the native vocabulary with no remapping hacks.
 */
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { createEditor } from "lexical";
import { ImageNode } from "../lexical/ImageNode";
import { $serializeToEnrichedInner, $setEditorContentFromHtml } from "../lexical/serialize";

function roundTrip(inner: string): string {
    const editor = createEditor({
        namespace: "test",
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, CodeHighlightNode, ImageNode],
        onError: (e) => { throw e; },
    });
    editor.update(() => $setEditorContentFromHtml(editor, `<html>\n${inner}\n</html>`), { discrete: true });
    let out = "";
    editor.getEditorState().read(() => { out = $serializeToEnrichedInner(); });
    return out;
}

describe("native-vocabulary serializer round-trip", () => {
    it("preserves inline marks as <b>/<i>/<u>/<s>", () => {
        expect(roundTrip("<p><b>bold</b> <i>it</i> <u>un</u> <s>st</s></p>")).toBe(
            "<p><b>bold</b> <i>it</i> <u>un</u> <s>st</s></p>"
        );
    });

    it("normalizes legacy <strong>/<em> to <b>/<i>", () => {
        expect(roundTrip("<p><strong>b</strong><em>i</em></p>")).toBe("<p><b>b</b><i>i</i></p>");
    });

    it("preserves H1–H3 and clamps H4+ to H3", () => {
        expect(roundTrip("<h1>a</h1>\n<h2>b</h2>\n<h3>c</h3>")).toBe("<h1>a</h1>\n<h2>b</h2>\n<h3>c</h3>");
        expect(roundTrip("<h4>d</h4>")).toBe("<h3>d</h3>");
    });

    it("preserves bullet and ordered lists", () => {
        expect(roundTrip("<ul><li>a</li><li>b</li></ul>")).toBe("<ul><li>a</li><li>b</li></ul>");
        expect(roundTrip("<ol><li>x</li><li>y</li></ol>")).toBe("<ol><li>x</li><li>y</li></ol>");
    });

    it("preserves blockquote", () => {
        expect(roundTrip("<blockquote>quote</blockquote>")).toBe("<blockquote>quote</blockquote>");
    });

    it("preserves links", () => {
        expect(roundTrip('<p><a href="https://example.com">link</a></p>')).toBe(
            '<p><a href="https://example.com">link</a></p>'
        );
    });

    it("preserves images with width/height", () => {
        expect(roundTrip('<p><img src="https://cdn.test/a.png" width="100" height="50"/></p>')).toBe(
            '<p><img src="https://cdn.test/a.png" width="100" height="50"/></p>'
        );
    });

    it("escapes only & < > (no &nbsp; spam)", () => {
        expect(roundTrip("<p>a &amp; b &lt; c &gt; d</p>")).toBe("<p>a &amp; b &lt; c &gt; d</p>");
    });

    it("preserves non-ASCII characters (accents, em-dash, emoji) literally", () => {
        expect(roundTrip("<p>café — résumé 🎉 prêt-à-porter</p>")).toBe("<p>café — résumé 🎉 prêt-à-porter</p>");
    });

    it("collapses runs of spaces per standard HTML (no &nbsp; spam — single spaces kept)", () => {
        // Intentional: we deliberately do NOT re-introduce &nbsp; processing, so a
        // run of consecutive spaces collapses to one on parse, like any HTML.
        expect(roundTrip("<p>multi   space</p>")).toBe("<p>multi space</p>");
    });

    it("joins multiple blocks with newlines", () => {
        expect(roundTrip("<p>one</p>\n<h2>two</h2>\n<ul><li>three</li></ul>")).toBe(
            "<p>one</p>\n<h2>two</h2>\n<ul><li>three</li></ul>"
        );
    });

    it("returns empty string for empty content", () => {
        expect(roundTrip("")).toBe("");
        expect(roundTrip("<p></p>")).toBe("");
    });
});
