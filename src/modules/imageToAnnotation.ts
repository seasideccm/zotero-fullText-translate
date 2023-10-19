import { getSortIndex } from "./transformTools";
import { getInfo } from "./imageAndFontInfo";
import { prepareReader } from "./prepareReader";
export async function imageToAnnotation() {
    const imgDataArr = (await getInfo()).imgDataArr;
    if (!imgDataArr.length) { return; }
    const positionPdf: any = {};
    imgDataArr.forEach((imgData: any) => {
        const p1x = imgData.transform[4];
        const p1y = imgData.transform[5];
        const p2x = imgData.imgData.width;
        const p2y = imgData.imgData.height;
        positionPdf.pageIndex = imgData.pageId - 1;
        const rect = [p1x, p1y, p2x, p2y];

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
