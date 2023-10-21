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

    const pathDataArr = infoDataArr.pathDataArr;
    pathDataArr.forEach((pathData: any) => {
        const transform = pathData.transform || [1, 0, 0, 1, 0, 0];
        const args = pathData.constructPathArgs.args;
        const noCurveOPS = pathData.constructPathArgs.ops.filter((e: any) => ![15, 16, 17].includes(e));
        if (!noCurveOPS.length) {
            return false;
        }
        //筛选数组索引奇偶的最大最小值，作为矩形的两点坐标
        const p1x = Math.min(...args.filter((e: any, i: number) => i % 2 == 0));
        const p1y = Math.min(...args.filter((e: any, i: number) => i % 2 == 1));
        const p2x = Math.max(...args.filter((e: any, i: number) => i % 2 == 0));
        const p2y = Math.max(...args.filter((e: any, i: number) => i % 2 == 1));

        const positionPdf: any = getPosition([p1x, p1y, p2x, p2y], transform, pathData.pageId - 1);
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
    const test = "test";
}

export async function clearAnnotations() {
    const reader = (await prepareReader("pagesLoaded"))("reader");
    const attachment = reader._item;
    if (!attachment.isPDFAttachment()) { return; }
    const annotationManager = reader._internalReader._annotationManager;
    annotationManager._annotations.length = 0;
    annotationManager.render();
}