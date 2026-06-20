import { DecoratorNode, type DOMConversionMap, type DOMConversionOutput, type DOMExportOutput, type LexicalNode, type NodeKey, type SerializedLexicalNode, type Spread } from "lexical";
import * as React from "react";

export interface ImagePayload {
    src: string;
    width?: number;
    height?: number;
    key?: NodeKey;
}

export type SerializedImageNode = Spread<
    {
        src: string;
        width?: number;
        height?: number;
    },
    SerializedLexicalNode
>;

/** Hard ceiling (px) for an inline image's display width inside the editor. */
const MAX_DISPLAY_WIDTH = 720;

function convertImageElement(domNode: Node): null | DOMConversionOutput {
    if (!(domNode instanceof HTMLImageElement)) return null;
    const src = domNode.getAttribute("src");
    if (!src) return null;
    const width = parseInt(domNode.getAttribute("width") || "", 10) || undefined;
    const height = parseInt(domNode.getAttribute("height") || "", 10) || undefined;
    return { node: $createImageNode({ src, width, height }) };
}

/**
 * Inline image node whose HTML form mirrors `react-native-enriched`'s
 * `<img src="…" width="N" height="N"/>` exactly, so web-authored images load
 * losslessly on native (and vice-versa). It is inline (sits inside a paragraph)
 * to match the native editor, which inserts an image into a single line.
 */
export class ImageNode extends DecoratorNode<React.ReactElement> {
    __src: string;
    __width?: number;
    __height?: number;

    static getType(): string {
        return "image";
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__width, node.__height, node.__key);
    }

    constructor(src: string, width?: number, height?: number, key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__width = width;
        this.__height = height;
    }

    static importJSON(serialized: SerializedImageNode): ImageNode {
        return $createImageNode({
            src: serialized.src,
            width: serialized.width,
            height: serialized.height,
        });
    }

    exportJSON(): SerializedImageNode {
        return {
            type: "image",
            version: 1,
            src: this.__src,
            width: this.__width,
            height: this.__height,
        };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: () => ({ conversion: convertImageElement, priority: 0 }),
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("img");
        element.setAttribute("src", this.__src);
        if (this.__width) element.setAttribute("width", String(this.__width));
        if (this.__height) element.setAttribute("height", String(this.__height));
        return { element };
    }

    getSrc(): string {
        return this.__src;
    }

    getWidth(): number | undefined {
        return this.__width;
    }

    getHeight(): number | undefined {
        return this.__height;
    }

    createDOM(): HTMLElement {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.style.verticalAlign = "top";
        return span;
    }

    updateDOM(): false {
        return false;
    }

    isInline(): true {
        return true;
    }

    decorate(): React.ReactElement {
        const width = this.__width
            ? Math.min(this.__width, MAX_DISPLAY_WIDTH)
            : undefined;
        return (
            <img
                src={this.__src}
                style={{
                    display: "block",
                    maxWidth: width ? `${width}px` : "100%",
                    width: width ? `${width}px` : undefined,
                    height: "auto",
                    borderRadius: 8,
                    margin: "8px auto",
                }}
                alt=""
            />
        );
    }
}

export function $createImageNode({ src, width, height, key }: ImagePayload): ImageNode {
    return new ImageNode(src, width, height, key);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
