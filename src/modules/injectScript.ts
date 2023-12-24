

function imageFlickerTest(attachmentKey: string, editorInstance: Zotero.EditorInstance) {
    const editorCore = editorInstance._iframeWindow.wrappedJSObject._currentEditorInstance._editorCore;
    const win = editorInstance._iframeWindow;
    const state = editorCore.view.state;
    const dispatch = editorCore.view.dispatch;
    const { tr } = state;
    let nodeTarget: any, posTarget: number;
    state.doc.descendants((node: any, pos: number) => {
        if (node.attrs?.attachmentKey === attachmentKey) {
            nodeTarget = node;
            posTarget = pos;
            const width = node.attrs.width * 1.1;
            tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                width: width
            });
            return false;
            dispatch(tr);
        }
    });

    if (!nodeTarget) return;

}

export const testAPI = {
    imageFlickerTest
};
// @ts-ignore
window.testAPI = testAPI;