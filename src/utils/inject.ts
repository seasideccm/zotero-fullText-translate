export function editorInstanceHook() {
    Zotero.Notes.registerEditorInstance = new Proxy(
        Zotero.Notes.registerEditorInstance,
        {
            apply: (
                target,
                thisArg,
                argumentsList: [instance: Zotero.EditorInstance],
            ) => {
                target.apply(thisArg, argumentsList);
                argumentsList.forEach(onEditorInstanceCreated);
            },
        },
    );
}

async function onEditorInstanceCreated(editor: Zotero.EditorInstance) {
    await editor._initPromise;
    if (!addon.data.alive) {
        return;
    }

    if (Zotero.ItemTypes.getID("note") !== editor._item.itemTypeID) {
        return;
    }
    await injectScripts(editor._iframeWindow);

}


async function injectScripts(win: Window) {
    ztoolkit.UI.appendElement(
        {
            tag: "script",
            id: "imageFlicker-script",
            properties: {
                innerHTML: await getFileContent(
                    rootURI + "chrome/content/scripts/injectScript.js",
                ),
            },
            ignoreIfExists: true,
        },
        win.document.head,
    );
}

export async function getFileContent(path: string) {
    const contentOrXHR = await Zotero.File.getContentsAsync(path);
    const content =
        typeof contentOrXHR === "string"
            ? contentOrXHR
            : (contentOrXHR as any as XMLHttpRequest).response;
    return content;
}