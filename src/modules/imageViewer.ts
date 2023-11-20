import { config } from "../../package.json";


export const viewImgMenuArr = [
    {
        label: "info-viewImg",
        func: viewImg,
        args: []
    },
];
function viewImg() {
    const dialogData = makeDialogData(makeContent());
    makeDialogImgViewer();
    showDialog(dialogData);
}


function makeContent(itemID?: number) {
    let items: Zotero.Item | Zotero.Item[];
    if (itemID) {
        items = Zotero.Items.get(itemID);
    } else {
        items = Zotero.getActiveZoteroPane().getSelectedItems();
    }
    if (!Array.isArray(items)) {
        items = [items];
    }
    const contentArr: string[] = [];
    items.filter((item: Zotero.Item) => {
        const attachmentIDs = item.getAttachments();
        attachmentIDs.filter((attachmentID: number) => {
            const attachment = Zotero.Items.get(attachmentID);
            if (!attachment.isAttachment()) return;
            if (!attachment.attachmentContentType.includes("image")) return;
            const src = attachment.getFilePath();
            if (!src) return;
            const imgHtml = makeImgHtml(src, attachment.key);
            contentArr.push(imgHtml);
        });
    });
    return contentArr.join('');
}

function makeImgHtml(src: string, attachmentKey: string) {

    const imgHtml = `<img src="` + src + `" id="showImg-` + attachmentKey + `" />`;
    return imgHtml;
    //`<img src="${src}" id="showImg-${attachmentKey}" />`;
}

function makeDialogImgViewer() {
    const dialogCellID = "dialogImgViewer-container";
    //如果本插件对话框存在，则视为dialogHelperFont，无需重复创建。之后再设置数据
    if (!addon.data.globalObjs?.dialogImgViewer) {
        const dialogImgViewer = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0,
                {
                    tag: "div",
                    namespace: "html",
                    id: dialogCellID,
                    attributes: {
                        style: "width: 400; height: 430;",
                        //数据绑定的数据来源于dialogData的哪个键值
                        "data-bind": "content",
                        //元素某个property
                        "data-prop": "innerHTML",
                    },
                }
            );
        //将对话框挂载到全局对象 dialog 上
        addon.data.globalObjs = {
            dialogImgViewer: dialogImgViewer,
        };
    }
}

function showDialog(dialogData: any) {
    /* const openArgs = {
        title: `${config.addonRef}`,
    }; */
    const dialogCellID = "dialogImgViewer-container";
    const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    if (dialogImgViewer.window) {
        if (dialogImgViewer.window.closed) {
            dialogImgViewer.setDialogData(dialogData).open(`${config.addonRef}`);

        } else {
            dialogImgViewer.window.focus();
            const divImgViewer = dialogImgViewer.window.document.querySelector("#" + dialogCellID);
            divImgViewer!.innerHTML = dialogData.content;
        };
    } else {
        dialogImgViewer.setDialogData(dialogData).open(`${config.addonRef}`);
    }
}

function makeDialogData(content: string) {
    const dialogData = {
        "content": content
    };
    return dialogData;
}




















/* .addCell(0, 0,
    {
        tag: "div",
        namespace: "html",
        id: dialogCellID,
        attributes: {
            style: "width: 400; height: 430;",
            //数据绑定的数据来源于dialogData的哪个键值
            "data-bind": "content",
            //元素某个property
            "data-prop": "innerHTML",
        },
        children:[],

    }
) */
