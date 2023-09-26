import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark, { all } from "rehype-remark";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { defaultHandlers } from "hast-util-to-mdast";
import { toHtml } from "hast-util-to-html";
import { toText } from "hast-util-to-text";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { visitParents } from "unist-util-visit-parents";
import { h } from "hastscript";
import { Root as HRoot, RootContent } from "hast";
import { Root as MRoot } from "mdast";
import { Nodes } from "hast-util-to-text/lib";
import YAML = require("yamljs");
import seedrandom = require("seedrandom");
import { LargePrefHelper } from "zotero-plugin-toolkit/dist/helpers/largePref";
import{config}from"../../package.json"


export {
    note2md,
    md2html,
    html2md,
};

function randomString(len: number, seed?: string, chars?: string) {
    if (!chars) {
        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    }
    if (!len) {
        len = 8;
    }
    let str = "";
    const random = seedrandom(seed);
    for (let i = 0; i < len; i++) {
        const rnum = Math.floor(random() * chars.length);
        str += chars.substring(rnum, rnum + 1);
    }
    return str;
}

export function formatPath(path: string, suffix: string = "") {
    path = Zotero.File.normalizeToUnix(path);
    if (Zotero.isWin) {
        path = path.replace(/\//g, "\\");
    }
    if (suffix && !path.endsWith(suffix)) {
        path += suffix;
    }
    return path;
}

export function jointPath(...paths: string[]) {
    try {
        return formatPath(PathUtils.join(...paths));
    } catch (e) {
        ztoolkit.log("[jointPath]", e);
        return "";
    }
}

function processN2MRehypeHighlightNodes(
    nodes: string | any[],
    mode: NodeMode = NodeMode.default,
) {
    if (!nodes.length) {
        return;
    }
    for (const node of nodes) {
        let annotation;
        try {
            annotation = JSON.parse(
                decodeURIComponent(node.properties.dataAnnotation),
            );
        } catch (e) {
            continue;
        }
        if (!annotation) {
            continue;
        }
        // annotation.uri was used before note-editor v4
        const uri = annotation.attachmentURI || annotation.uri;
        const position = annotation.position;

        if (typeof uri === "string" && typeof position === "object") {
            let openURI;
            const uriParts = uri.split("/");
            const libraryType = uriParts[3];
            const key = uriParts[uriParts.length - 1];
            if (libraryType === "users") {
                openURI = "zotero://open-pdf/library/items/" + key;
            }
            // groups
            else {
                const groupID = uriParts[4];
                openURI = "zotero://open-pdf/groups/" + groupID + "/items/" + key;
            }

            openURI +=
                "?page=" +
                (position.pageIndex + 1) +
                (annotation.annotationKey
                    ? "&annotation=" + annotation.annotationKey
                    : "");

            let newNode = h("span", [
                h(node.tagName, node.properties, node.children),
                h("span", " ("),
                h("a", { href: openURI }, ["pdf"]),
                h("span", ") "),
            ]);
            const annotKey =
                annotation.annotationKey ||
                randomString(
                    8,
                    Zotero.Utilities.Internal.md5(node.properties.dataAnnotation),
                    Zotero.Utilities.allowedKeyChars,
                );

            if (mode === NodeMode.wrap) {
                newNode.children.splice(0, 0, h("wrapperleft", `annot:${annotKey}`));
                newNode.children.push(h("wrapperright", `annot:${annotKey}`));
            } else if (mode === NodeMode.replace) {
                newNode = h("placeholder", `annot:${annotKey}`);
            } else if (mode === NodeMode.direct) {
                const newChild = h("span") as any;
                replace(newChild, node);
                newChild.children = [h("a", { href: openURI }, node.children)];
                newChild.properties.ztype = "zhighlight";
                newNode = h("zhighlight", [newChild]);
            }
            replace(node, newNode);
        }
    }
}

function getN2MRehypeHighlightNodes(rehype: HRoot) {
    const nodes: any[] | null | undefined = [];
    visit(
        rehype,
        (node: any) =>
            node.type === "element" &&
            node.properties?.className?.includes("highlight"),
        (node) => nodes.push(node),
    );
    return new Array(...new Set(nodes));
}

function processN2MRehypeCitationNodes(
    nodes: string | any[],
    mode: NodeMode = NodeMode.default,
) {
    if (!nodes.length) {
        return;
    }
    for (const node of nodes) {
        let citation;
        try {
            citation = JSON.parse(decodeURIComponent(node.properties.dataCitation));
        } catch (e) {
            continue;
        }
        if (!citation?.citationItems?.length) {
            continue;
        }

        const uris: any[] = [];
        for (const citationItem of citation.citationItems) {
            const uri = citationItem.uris[0];
            if (typeof uri === "string") {
                const uriParts = uri.split("/");
                const libraryType = uriParts[3];
                const key = uriParts[uriParts.length - 1];
                if (libraryType === "users") {
                    uris.push("zotero://select/library/items/" + key);
                }
                // groups
                else {
                    const groupID = uriParts[4];
                    uris.push("zotero://select/groups/" + groupID + "/items/" + key);
                }
            }
        }

        let childNodes: any[] = [];

        visit(
            node,
            (_n: any) => _n.properties?.className.includes("citation-item"),
            (_n: any) => {
                return childNodes?.push(_n);
            },
        );

        // For unknown reasons, the element will be duplicated. Remove them.
        childNodes = new Array(...new Set(childNodes));

        // Fallback to pre v5 note-editor schema that was serializing citations as plain text i.e.:
        // <span class="citation" data-citation="...">(Jang et al., 2005, p. 14; Kongsgaard et al., 2009, p. 790)</span>
        if (!childNodes.length) {
            childNodes = toText(node).slice(1, -1).split("; ");
        }

        let newNode = h("span", node.properties, [
            { type: "text", value: "(" },
            ...childNodes.map((child, i) => {
                if (!child) {
                    return h("text", "");
                }
                const newNode = h("span");
                replace(newNode, child);
                newNode.children = [h("a", { href: uris[i] }, child.children)];
                return newNode;
            }),
            { type: "text", value: ")" },
        ]);
        const citationKey = randomString(
            8,
            Zotero.Utilities.Internal.md5(node.properties.dataCitation),
            Zotero.Utilities.allowedKeyChars,
        );
        if (mode === NodeMode.wrap) {
            newNode.children.splice(0, 0, h("wrapperleft", `cite:${citationKey}`));
            newNode.children.push(h("wrapperright", `cite:${citationKey}`));
        } else if (mode === NodeMode.replace) {
            newNode = h("placeholder", `cite:${citationKey}`);
        } else if (mode === NodeMode.direct) {
            const newChild = h("span") as any;
            replace(newChild, newNode);
            newChild.properties.ztype = "zcitation";
            newNode = h("zcitation", [newChild]);
        }
        replace(node, newNode);
    }
}

function getN2MRehypeCitationNodes(rehype: HRoot) {
    const nodes: any[] | null | undefined = [];
    visit(
        rehype,
        (node: any) =>
            node.type === "element" &&
            node.properties?.className?.includes("citation"),
        (node) => nodes.push(node),
    );
    return new Array(...new Set(nodes));
}

export function getNoteLinkParams(link: string) {
    try {
        const url = new (ztoolkit.getGlobal("URL"))(link);
        const pathList = url.pathname.split("/").filter((s) => s);
        const noteKey = pathList.pop();
        const id = pathList.pop();
        let libraryID: number;
        if (id === "u") {
            libraryID = Zotero.Libraries.userLibraryID;
        } else {
            libraryID = Zotero.Groups.getLibraryIDFromGroupID(id);
        }
        const line = url.searchParams.get("line");
        return {
            link,
            libraryID,
            noteKey,
            noteItem: Zotero.Items.getByLibraryAndKey(libraryID, noteKey || "") as
                | Zotero.Item
                | false,
            ignore: Boolean(url.searchParams.get("ignore")) || undefined,
            lineIndex: typeof line === "string" ? parseInt(line) : undefined,
            sectionName: url.searchParams.get("section") || undefined,
        };
    } catch (e: unknown) {
        return {
            link,
            libraryID: -1,
            noteKey: undefined,
            noteItem: false as const,
            ignore: undefined,
            lineIndex: undefined,
            sectionName: undefined,
        };
    }
}

const data = new LargePrefHelper(
    `${config.prefsPrefix}.syncNoteIds`,
    `${config.prefsPrefix}.syncDetail-`,
    "parser",
  )
  function isSyncNote(noteId: number): boolean {
    return !!data?.hasKey(String(noteId));
  }
  function getSyncStatus(noteId?: number) {
    const defaultStatus = {
      path: "",
      filename: "",
      md5: "",
      noteMd5: "",
      lastsync: new Date().getTime(),
      itemID: -1,
    };
    const status = {
      ...defaultStatus,
      ...(data?.getValue(String(noteId))),
    };
    status.path = formatPath(status.path);
    return status;
  }
  
  export async function fileExists(path: string): Promise<boolean> {
    if (!path) {
      return false;
    }
    try {
      // IOUtils.exists() will throw error if path is not valid
      return await IOUtils.exists(formatPath(path));
    } catch (e) {
      ztoolkit.log("[fileExists]", e);
      return false;
    }
  }
  

  
  async function getMDFileName(noteId: number, searchDir?: string) {
    const syncStatus = getSyncStatus(noteId);
    // If the note is already synced, use the filename in sync status
    if (
      (!searchDir || searchDir === syncStatus.path) &&
      syncStatus.filename &&
      (await fileExists(PathUtils.join(syncStatus.path, syncStatus.filename)))
    ) {
      return syncStatus.filename;
    }
    // If the note is not synced or the synced file does not exists, search for the latest file with the same key
    const noteItem = Zotero.Items.get(noteId);
    if (searchDir !== undefined && (await fileExists(searchDir))) {
      const mdRegex = /\.(md|MD|Md|mD)$/;
      let matchedFileName = null;
      let matchedDate = 0;
      await Zotero.File.iterateDirectory(
        searchDir,
        async (entry: OS.File.Entry) => {
          if (entry.isDir) return;
          if (mdRegex.test(entry.name)) {
            if (
              entry.name.split(".").shift()?.split("-").pop() === noteItem.key
            ) {
              const stat = await IOUtils.stat(entry.path);
              if (stat.lastModified > matchedDate) {
                matchedFileName = entry.name;
                matchedDate = stat.lastModified;
              }
            }
          }
        },
      );
      if (matchedFileName) {
        return matchedFileName;
      }
    }
    // If no file found, use the template to generate a new filename
    return "zoteroNote"
  }
async function processN2MRehypeNoteLinkNodes(
    nodes: string | any[],
    dir: string,
    mode: NodeMode = NodeMode.default,
) {
    if (!nodes.length) {
        return;
    }
    for (const node of nodes) {
        const linkParam = getNoteLinkParams(node.properties.href);
        if (!linkParam.noteItem) {
            continue;
        }
        const link =
            mode === NodeMode.default ||
                !isSyncNote(linkParam.noteItem.id)
                ? node.properties.href
                : `./${await getMDFileName(linkParam.noteItem.id, dir)}`;
        const linkKey = randomString(
            8,
            Zotero.Utilities.Internal.md5(node.properties.href),
            Zotero.Utilities.allowedKeyChars,
        );
        if (mode === NodeMode.wrap) {
            const newNode = h("span", [
                h("wrapperleft", `note:${linkKey}`),
                h(
                    node.tagName,
                    Object.assign(node.properties, { href: link }),
                    node.children,
                ),
                h("wrapperright", `note:${linkKey}`),
            ]);
            replace(node, newNode);
        } else if (mode === NodeMode.replace) {
            const newNode = h("placeholder", `note:${linkKey}`);
            replace(node, newNode);
        } else if (mode === NodeMode.direct || mode === NodeMode.default) {
            const newChild = h("a", node.properties, node.children) as any;
            newChild.properties.zhref = node.properties.href;
            newChild.properties.href = link;
            newChild.properties.ztype = "znotelink";
            newChild.properties.class = "internal-link"; // required for obsidian compatibility
            const newNode = h("znotelink", [newChild]);
            replace(node, newNode);
        }
    }
}

function getN2MRehypeNoteLinkNodes(rehype: any) {
    const nodes: any[] | null | undefined = [];
    visit(
        rehype,
        (node: any) =>
            node.type === "element" &&
            node.tagName === "a" &&
            node.properties?.href &&
            /zotero:\/\/note\/\w+\/\w+\//.test(node.properties?.href),
        (node) => nodes.push(node),
    );
    return new Array(...new Set(nodes));
}

async function processN2MRehypeImageNodes(
    nodes: string | any[],
    libraryID: number,
    dir: string,
    skipSavingImages: boolean = false,
    absolutePath: boolean = false,
    mode: NodeMode = NodeMode.default,
) {
    if (!nodes.length) {
        return;
    }
    for (const node of nodes) {
        const imgKey = node.properties.dataAttachmentKey;

        const attachmentItem = (await Zotero.Items.getByLibraryAndKeyAsync(
            libraryID,
            imgKey,
        )) as Zotero.Item;
        if (!attachmentItem) {
            continue;
        }

        const oldFile = String(await attachmentItem.getFilePathAsync());
        const ext = oldFile.split(".").pop();
        const newAbsPath = formatPath(`${dir}/${imgKey}.${ext}`);
        let newFile = oldFile;
        try {
            // Don't overwrite
            if (skipSavingImages || (await fileExists(newAbsPath))) {
                newFile = newAbsPath;
            } else {
                newFile = (await Zotero.File.copyToUnique(oldFile, newAbsPath)).path;
            }
            newFile = formatPath(
                absolutePath
                    ? newFile
                    : `attachments/${PathUtils.split(newFile).pop()}`,
            );
        } catch (e) {
            ztoolkit.log(e);
        }

        node.properties.src = newFile ? newFile : oldFile;
        // If on Windows, convert path to Unix style
        if (Zotero.isWin) {
            node.properties.src = Zotero.File.normalizeToUnix(node.properties.src);
        }

        if (mode === NodeMode.direct) {
            const newChild = h("span") as any;
            replace(newChild, node);
            newChild.properties.ztype = "zimage";
            // const newNode = h("zimage", [newChild]);
            // replace(node, newNode);
            node.properties.alt = toHtml(newChild);
        }
    }
}

function getN2MRehypeImageNodes(rehype: any) {
    const nodes: any[] = [];
    visit(
        rehype,
        (node: any) =>
            node.type === "element" &&
            node.tagName === "img" &&
            node.properties?.dataAttachmentKey,
        (node) => nodes.push(node),
    );
    return new Array(...new Set(nodes));
}

async function note2md(
    noteItem: Zotero.Item,
    dir: string,
    options: {
        keepNoteLink?: boolean;
        withYAMLHeader?: boolean;
        skipSavingImages?: boolean;
    } = {},
) {
    const noteStatus = getNoteStatus(noteItem.id)!;
    const rehype = note2rehype(noteStatus.content);
    processN2MRehypeHighlightNodes(
        getN2MRehypeHighlightNodes(rehype as HRoot),
        NodeMode.direct,
    );
    processN2MRehypeCitationNodes(
        getN2MRehypeCitationNodes(rehype as HRoot),
        NodeMode.direct,
    );
    await processN2MRehypeNoteLinkNodes(
        getN2MRehypeNoteLinkNodes(rehype),
        dir,
        options.keepNoteLink ? NodeMode.default : NodeMode.direct,
    );
    await processN2MRehypeImageNodes(
        getN2MRehypeImageNodes(rehype),
        noteItem.libraryID,
        jointPath(dir, "attachments"),
        options.skipSavingImages,
        false,
        NodeMode.direct,
    );
    const remark = await rehype2remark(rehype as HRoot);
    if (!remark) {
        return "Parsing Error: Rehype2Remark";
    }
    const md = remark2md(remark as MRoot);

    return md;
}

async function md2html(md: string) {
    const remark = md2remark(md);
    const rehype = await remark2rehype(remark);
    const html = rehype2note(rehype as HRoot);
    return html;
}

async function html2md(html: string) {
    const rehype = note2rehype(html);
    const remark = await rehype2remark(rehype as HRoot);
    if (!remark) {
        return "Parsing Error: HTML2MD";
    }
    const md = remark2md(remark as MRoot);
    return md;
}

function remark2md(remark: MRoot) {
    return String(
        unified()
            .use(remarkGfm)
            .use(remarkMath)
            .use(remarkStringify, {
                handlers: {
                    pre: (node: { value: string; }) => {
                        return "```\n" + node.value + "\n```";
                    },
                    u: (node: { value: string; }) => {
                        return "<u>" + node.value + "</u>";
                    },
                    sub: (node: { value: string; }) => {
                        return "<sub>" + node.value + "</sub>";
                    },
                    sup: (node: { value: string; }) => {
                        return "<sup>" + node.value + "</sup>";
                    },
                    styleTable: (node: { value: any; }) => {
                        return node.value;
                    },
                    wrapper: (node: { value: string; }) => {
                        return "\n<!-- " + node.value + " -->\n";
                    },
                    wrapperleft: (node: { value: string; }) => {
                        return "<!-- " + node.value + " -->\n";
                    },
                    wrapperright: (node: { value: string; }) => {
                        return "\n<!-- " + node.value + " -->";
                    },
                    zhighlight: (node: { value: string; }) => {
                        return node.value.replace(/(^<zhighlight>|<\/zhighlight>$)/g, "");
                    },
                    zcitation: (node: { value: string; }) => {
                        return node.value.replace(/(^<zcitation>|<\/zcitation>$)/g, "");
                    },
                    znotelink: (node: { value: string; }) => {
                        return node.value.replace(/(^<znotelink>|<\/znotelink>$)/g, "");
                    },
                    zimage: (node: { value: string; }) => {
                        return node.value.replace(/(^<zimage>|<\/zimage>$)/g, "");
                    },
                },
            } as any)
            .stringify(remark as any),
    );
}

async function rehype2remark(rehype: HRoot) {
    return await unified()
        .use(rehypeRemark, {
            handlers: {
                span: (h, node) => {
                    if (
                        node.properties?.style?.includes("text-decoration: line-through")
                    ) {
                        return h(node, "delete", all(h, node));
                    } else if (node.properties?.style?.includes("background-color")) {
                        return h(node, "html", toHtml(node));
                    } else if (node.properties?.style?.includes("color")) {
                        return h(node, "html", toHtml(node));
                    } else if (node.properties?.className?.includes("math")) {
                        return h(node, "inlineMath", toText(node).slice(1, -1));
                    } else {
                        return h(node, "paragraph", all(h, node));
                    }
                },
                pre: (h, node) => {
                    if (node.properties?.className?.includes("math")) {
                        return h(node, "math", toText(node).slice(2, -2));
                    } else {
                        return h(node, "code", toText(node));
                    }
                },
                u: (h, node) => {
                    return h(node, "u", toText(node));
                },
                sub: (h, node) => {
                    return h(node, "sub", toText(node));
                },
                sup: (h, node) => {
                    return h(node, "sup", toText(node));
                },
                table: (h, node) => {
                    let hasStyle = false;
                    visit(
                        node,
                        (_n) =>
                            _n.type === "element" &&
                            ["tr", "td", "th"].includes((_n as any).tagName),
                        (node) => {
                            if (node.properties.style) {
                                hasStyle = true;
                            }
                        },
                    );
                    // if (0 && hasStyle) {
                    //   return h(node, "styleTable", toHtml(node));
                    // } else {
                    return defaultHandlers.table(h, node);
                    // }
                },
                wrapper: (h, node) => {
                    return h(node, "wrapper", toText(node));
                },
                wrapperleft: (h, node) => {
                    return h(node, "wrapperleft", toText(node));
                },
                wrapperright: (h, node) => {
                    return h(node, "wrapperright", toText(node));
                },
                zhighlight: (h, node) => {
                    return h(node, "zhighlight", toHtml(node));
                },
                zcitation: (h, node) => {
                    return h(node, "zcitation", toHtml(node));
                },
                znotelink: (h, node) => {
                    return h(node, "znotelink", toHtml(node));
                },
                zimage: (h, node) => {
                    return h(node, "zimage", toHtml(node));
                },
            },
        })
        .run(rehype as any);
}

function note2rehype(str: string) {
    const rehype = unified()
        .use(remarkGfm)
        .use(remarkMath)
        .use(rehypeParse, { fragment: true })
        .parse(str);

    // Make sure <br> is inline break. Remove \n before/after <br>
    const removeBlank = (node: any, parentNode: any, offset: number) => {
        const idx = parentNode.children.indexOf(node);
        const target = parentNode.children[idx + offset];
        if (
            target &&
            target.type === "text" &&
            !target.value.replace(/[\r\n]/g, "")
        ) {
            (parentNode.children as any[]).splice(idx + offset, 1);
        }
    };
    visitParents(
        rehype,
        (_n: any) => _n.type === "element" && _n.tagName === "br",
        (_n: any, ancestors) => {
            if (ancestors.length) {
                const parentNode = ancestors[ancestors.length - 1];
                removeBlank(_n, parentNode, -1);
                removeBlank(_n, parentNode, 1);
            }
        },
    );

    // Make sure <span> and <img> wrapped by <p>
    visitParents(
        rehype,
        (_n: any) =>
            _n.type === "element" && (_n.tagName === "span" || _n.tagName === "img"),
        (_n: any, ancestors) => {
            if (ancestors.length) {
                const parentNode = ancestors[ancestors.length - 1];
                if (parentNode === rehype) {
                    const newChild = h("span");
                    replace(newChild, _n);
                    const p = h("p", [newChild]);
                    replace(_n, p);
                }
            }
        },
    );

    // Make sure empty <p> under root node is removed
    visitParents(
        rehype,
        (_n: any) => _n.type === "element" && _n.tagName === "p",
        (_n: any, ancestors) => {
            if (ancestors.length) {
                const parentNode = ancestors[ancestors.length - 1];
                if (parentNode === rehype && !_n.children.length && !toText(_n)) {
                    parentNode.children.splice(parentNode.children.indexOf(_n), 1);
                }
            }
        },
    );
    return rehype;
}

function md2remark(str: string) {
    // Parse Obsidian-style image ![[xxx.png]]
    // Encode spaces in link, otherwise it cannot be parsed to image node
    str = str
        .replace(/!\[\[(.*)\]\]/g, (s: string) => `![](${s.slice(3, -2)})`)
        .replace(
            /!\[.*\]\((.*)\)/g,
            (s: string) =>
                `![](${encodeURIComponent(s.match(/\(.*\)/g)![0].slice(1, -1))})`,
        );
    const remark = unified()
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkParse)
        .parse(str);
    return remark;
}

async function remark2rehype(remark: any) {
    return await unified()
        .use(remarkRehype, {
            allowDangerousHtml: true,
        })
        .run(remark);
}

function rehype2note(rehype: HRoot) {
    // Del node
    visit(
        rehype,
        (node: any) => node.type === "element" && (node as any).tagName === "del",
        (node: any) => {
            node.tagName = "span";
            node.properties.style = "text-decoration: line-through";
        },
    );

    // Code node
    visitParents(
        rehype,
        (node: any) => node.type === "element" && (node as any).tagName === "code",
        (node: any, ancestors) => {
            const parent = ancestors.length
                ? ancestors[ancestors.length - 1]
                : undefined;
            if (parent?.type == "element" && parent?.tagName === "pre") {
                node.value = toText(node);
                node.type = "text";
            }
        },
    );

    // Table node with style
    visit(
        rehype,
        (node: any) => node.type === "element" && (node as any).tagName === "table",
        (node: any) => {
            let hasStyle = false;
            visit(
                node,
                (_n: any) =>
                    _n.type === "element" &&
                    ["tr", "td", "th"].includes((_n as any).tagName),
                (node: any) => {
                    if (node.properties.style) {
                        hasStyle = true;
                    }
                },
            );
            if (hasStyle) {
                node.value = toHtml(node).replace(/[\r\n]/g, "");
                node.children = [];
                node.type = "raw";
            }
        },
    );

    // Convert thead to tbody
    visit(
        rehype,
        (node: any) => node.type === "element" && (node as any).tagName === "thead",
        (node: any) => {
            node.value = toHtml(node).slice(7, -8);
            node.children = [];
            node.type = "raw";
        },
    );

    // Wrap lines in list with <p> (for diff)
    visitParents(rehype, "text", (node: any, ancestors) => {
        const parent = ancestors.length
            ? ancestors[ancestors.length - 1]
            : undefined;
        if (
            node.value.replace(/[\r\n]/g, "") &&
            parent?.type == "element" &&
            ["li", "td"].includes(parent?.tagName)
        ) {
            node.type = "element";
            node.tagName = "p";
            node.children = [
                { type: "text", value: node.value.replace(/[\r\n]/g, "") },
            ];
            node.value = undefined;
        }
    });

    // No empty breakline text node in list (for diff)
    visit(
        rehype,
        (node: any) =>
            node.type === "element" &&
            ((node as any).tagName === "li" || (node as any).tagName === "td"),
        (node: any) => {
            node.children = node.children.filter(
                (_n: { type: string; value: string; }) =>
                    _n.type === "element" ||
                    (_n.type === "text" && _n.value.replace(/[\r\n]/g, "")),
            );
        },
    );

    // Math node
    visit(
        rehype,
        (node: any) =>
            node.type === "element" &&
            ((node as any).properties?.className?.includes("math-inline") ||
                (node as any).properties?.className?.includes("math-display")),
        (node: any) => {
            if (node.properties.className.includes("math-inline")) {
                node.children = [
                    { type: "text", value: "$" },
                    ...node.children,
                    { type: "text", value: "$" },
                ];
            } else if (node.properties.className.includes("math-display")) {
                node.children = [
                    { type: "text", value: "$$" },
                    ...node.children,
                    { type: "text", value: "$$" },
                ];
                node.tagName = "pre";
            }
            node.properties.className = "math";
        },
    );

    // Ignore link rel attribute, which exists in note
    visit(
        rehype,
        (node: any) => node.type === "element" && (node as any).tagName === "a",
        (node: any) => {
            node.properties.rel = undefined;
        },
    );

    // Ignore empty lines, as they are not parsed to md
    const tempChildren: RootContent[] = [];
    const isEmptyNode = (_n: Nodes) =>
        (_n.type === "text" && !_n.value.trim()) ||
        (_n.type === "element" &&
            _n.tagName === "p" &&
            !_n.children.length &&
            !toText(_n).trim());
    for (const child of rehype.children) {
        if (
            tempChildren.length &&
            isEmptyNode(tempChildren[tempChildren.length - 1] as Nodes) &&
            isEmptyNode(child as Nodes)
        ) {
            continue;
        }
        tempChildren.push(child);
    }

    rehype.children = tempChildren;

    return unified()
        .use(rehypeStringify, {
            allowDangerousCharacters: true,
            allowDangerousHtml: true,
        })
        .stringify(rehype as any);
}
function replace(targetNode: any, sourceNode: any) {
    targetNode.type = sourceNode.type;
    targetNode.tagName = sourceNode.tagName;
    targetNode.properties = sourceNode.properties;
    targetNode.value = sourceNode.value;
    targetNode.children = sourceNode.children;
}

function getNoteStatus(noteId: number) {
    const noteItem = Zotero.Items.get(noteId);
    if (!noteItem?.isNote()) {
        return;
    }
    const fullContent = noteItem.getNote();
    const ret = {
        meta: "",
        content: "",
        tail: "</div>",
        lastmodify: Zotero.Date.sqlToDate(noteItem.dateModified, true),
    };
    const metaRegex = /"?data-schema-version"?="[0-9]*">/;
    const match = fullContent?.match(metaRegex);
    if (!match || match.length == 0) {
        ret.meta = `<div "data-schema-version"="8">`;
        ret.content = fullContent || "";
        return ret;
    }
    const idx = fullContent.search(metaRegex);
    if (idx != -1) {
        ret.content = fullContent.substring(
            idx + match[0].length,
            fullContent.length - ret.tail.length,
        );
    }
    return ret;
}

enum NodeMode {
    default = 0,
    wrap,
    replace,
    direct,
}