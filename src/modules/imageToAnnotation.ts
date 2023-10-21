import { getSortIndex, applyTransform } from "./transformTools";
import { getPDFInfo } from "./imageAndFontInfo";
import { prepareReader } from "./prepareReader";
export async function imageToAnnotation() {
    const infoDataArr = await getPDFInfo();
    const imgDataArr = infoDataArr.imgDataArr;
    if (!imgDataArr.length) { return; }
    imgDataArr.forEach((imgData: any) => {
        const transform = imgData.transform;
        /*pdf坐标系以左下角为（0,0），每个对象均视为单位大小1，
        根据该对象的transform确定坐标系中的位置,
        对左下角和右上角两点应用transform，得到坐标的具体值*/
        const positionPdf: any = getPosition([0, 0, 1, 1], transform, imgData.pageId - 1);
        makeAnnotation(positionPdf);
    });

    const tableArr = infoDataArr.tableArr;
    tableArr.forEach((tablePathData: any[]) => {
        const p1sx: number[] = [];
        const p1sy: number[] = [];
        const p2sx: number[] = [];
        const p2sy: number[] = [];
        const pageId = tablePathData[0].pageId;
        tablePathData.forEach((pathData: any) => {
            const args = pathData.constructPathArgs.args;

            //曲线先绕过
            const noneCurveOPS = pathData.constructPathArgs.ops.filter((e: any) => [15, 16, 17].includes(e));
            if (noneCurveOPS.length) {
                return false;
            }
            //表格先可以是矩形，参数是起点和宽高
            if (pathData.constructPathArgs.ops[0] == 19) {
                p1sx.push(args[0]);
                p1sy.push(args[1]);
                p2sx.push(args[0] + args[2]);
                p2sy.push(args[1] + args[3]);
            }
            //直线坐标是两个点
            const nolineOPS = pathData.constructPathArgs.ops.filter((e: any) => ![13, 14, 18].includes(e));
            if (!nolineOPS.length) {
                p1sx.push(...args.filter((e: number, i: number) => i % 2 == 0));
                p1sy.push(...args.filter((e: number, i: number) => i % 2 == 1));
                p2sx.push(...args.filter((e: number, i: number) => i % 2 == 0));
                p2sy.push(...args.filter((e: number, i: number) => i % 2 == 1));
            }
        });
        const p1x = Math.min(...p1sx);
        const p1y = Math.min(...p1sy);
        const p2x = Math.max(...p2sx);
        const p2y = Math.max(...p2sy);
        const transform = tablePathData[0].transform || [1, 0, 0, 1, 0, 0];
        const positionPdf: any = getPosition([p1x, p1y, p2x, p2y], transform, pageId - 1);
        makeAnnotation(positionPdf);
    });

    function getPosition(p: number[], m: number[], pageIndex: any) {
        const p1 = applyTransform([p[0], p[1]], m);
        const p2 = applyTransform([p[2], p[3]], m);
        const rect: number[] = [p1[0], p1[1], p2[0], p2[1]];
        return {
            rects: [rect],
            pageIndex: pageIndex
        };
    }

}

export async function makeAnnotation(positionPdf: any[], type?: string, color?: string, pageLabel?: string
    , sortIndex?: string, tag?: string) {
    const reader = (await prepareReader("pagesLoaded"))("reader");
    const attachment = reader._item;
    if (!attachment.isPDFAttachment()) { return; }
    const annotationManager = reader._internalReader._annotationManager;
    if (annotationManager._readOnly) {
        return null;
    }
    const annotation: any = {};
    annotation.color = color || "#ffd400";
    annotation.type = type || "image";
    annotation.position = positionPdf;
    annotation.pageLabel = pageLabel || '';
    annotation.sortIndex = sortIndex || getSortIndex((await prepareReader("pagesLoaded"))("pdfPages"), positionPdf);
    annotation.text = annotation.text || '';
    annotation.comment = annotation.comment || '';
    annotation.tags = [];
    annotation.key = annotationManager._generateObjectKey();
    annotation.dateCreated = (new Date()).toISOString();
    annotation.dateModified = annotation.dateCreated;
    annotation.authorName = annotationManager._authorName;
    if (annotationManager._authorName) {
        annotation.isAuthorNameAuthoritative = true;
    }
    if (annotation.position.rects) {
        annotation.position.rects = annotation.position.rects.map(
            (rect: any) => rect.map((value: any) => parseFloat(value.toFixed(3)))
        );
    }
    const savedAnnotation = await Zotero.Annotations.saveFromJSON(attachment, annotation);
    if (tag) {
        savedAnnotation.addTag(tag);
    }
    await savedAnnotation.saveTx();

}

export async function clearAnnotations() {
    const reader = (await prepareReader("pagesLoaded"))("reader");
    const attachment = reader._item;
    if (!attachment.isPDFAttachment()) { return; }
    const annotationManager = reader._internalReader._annotationManager;
    const annotations: any[] = annotationManager._annotations;
    const ids = annotations.map((a: any) => a.id).filter((id: any) => id);
    //隐藏
    //annotationManager._annotations.length = 0;
    //annotationManager.render();
    //id号
    //reader.annotationItemIDs.length = 0;
    //初始注释来源
    //reader._state.annotations
    //await annotation.eraseTx()此处非函数？？
    annotationManager._onDelete(ids);
    annotations.length = 0;
    annotationManager.render();
}