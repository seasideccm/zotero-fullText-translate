import { getSortIndex, applyTransform } from "./transformTools";
import { getInfo } from "./imageAndFontInfo";
import { prepareReader } from "./prepareReader";
export async function imageToAnnotation() {
    const infoDataArr = (await getInfo());
    const imgDataArr = infoDataArr.imgDataArr;
    if (!imgDataArr.length) { return; }
    imgDataArr.forEach((imgData: any) => {
        const rect: number[] = [];
        const transform = imgData.transform;
        /*pdf坐标系以左下角为（0,0），每个对象均视为单位大小1，
        根据该对象的transform确定坐标系中的位置,
        对左下角和右上角两点应用transform，得到坐标的具体值*/
        const p1 = applyTransform([0, 0], transform);
        const p2 = applyTransform([1, 1], transform);
        rect.push(p1[0], p1[1], p2[0], p2[1]);

        /* const p1x = imgData.transform[4];
        const p1y = imgData.transform[5];
        const p2x = imgData.imgData.width;
        const p2y = imgData.imgData.height; */
        const positionPdf: any = {};
        positionPdf.pageIndex = imgData.pageId - 1;
        positionPdf.rects = [rect];
        makeAnnotation(positionPdf);
    });
    const pathDataArr = infoDataArr.pathDataArr;
    pathDataArr.forEach((pathData: any) => {
        const rect: number[] = [];
        const transform = pathData.transform;
        const p1x = Math.min(...pathData.pathArgs.filter((e: any, i: number) => i % 2 == 0));
        const p1y = Math.min(...pathData.pathArgs.filter((e: any, i: number) => i % 2 == 1));
        const p2x = Math.max(...pathData.pathArgs.filter((e: any, i: number) => i % 2 == 0));
        const p2y = Math.max(...pathData.pathArgs.filter((e: any, i: number) => i % 2 == 1));
        const p1 = applyTransform([p1x, p1y], transform);
        const p2 = applyTransform([p2x, p2y], transform);
        rect.push(p1[0], p1[1], p2[0], p2[1]);
        const positionPdf: any = {};
        positionPdf.pageIndex = pathData.pageId - 1;
        positionPdf.rects = [rect];
        makeAnnotation(positionPdf);
    });

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
