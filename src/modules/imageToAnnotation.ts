import { getSortIndex, applyTransform, quickIntersectRect, expandBoundingBox, getPosition } from "./transformTools";
import { getOpsInfo } from "./imageTableFontInfo";
import { prepareReader } from "./prepareReader";

export async function imageToAnnotation() {
    const pages: any[] = (await prepareReader("pagesLoaded"))("pages");
    for (const page of pages) {
        const infoDataArr = await getOpsInfo(page);
        const imgDataArr = infoDataArr.imgDataArr;
        const tableArr = infoDataArr.tableArr;
        const pageLabel = page.pageLabel;

        imgDataArr.forEach((imgData: any) => {
            /*pdf坐标系以左下角为（0,0），每个对象均视为单位大小1，
            根据该对象的transform确定坐标系中的位置,
            对左下角和右上角两点应用transform，得到坐标的具体值*/

            //const positionPdf: any = getPosition([0, 0, 1, 1], transform, imgData.pageId - 1);
            //初始rect,如果有多个transform则依次应用，顺序不能乱，
            //每次返回rect，重新对rect赋值
            const transform: number[][] = JSON.parse(JSON.stringify(imgData.transform));
            if (!transform.length) {
                transform.push([1, 0, 0, 1, 0, 0]);
            }
            let rect: number[] = [0, 0, 1, 1];
            transform.filter((e: any) => { rect = getPosition(rect, e); });
            const positionPdf: any = {
                rects: [rect],
                pageIndex: imgData.pageId - 1
            };
            makeAnnotation(positionPdf, pageLabel);
        });

        //const cache: number[][] = [];
        tableArr.forEach((tableData: any) => {

            const rect: number[] = tableData.rect_pdf;
            const positionPdf: {
                rects: number[][];
                pageIndex: number;
            } = {
                rects: [rect],
                pageIndex: tableData.pageId - 1
            };
            makeAnnotation(positionPdf, pageLabel);
        });


    }
}



export async function makeAnnotation(
    positionPdf: {
        rects: number[][];
        pageIndex: number;
    },
    pageLabel?: string,
    type?: string,
    color?: string,
    sortIndex?: string,
    tag?: string
) {
    const reader = (await prepareReader("pagesLoaded"))("reader");
    const pages = (await prepareReader("pagesLoaded"))("pages");
    const attachment = reader._item;
    if (!attachment.isPDFAttachment()) { return; }
    const annotationManager = reader._internalReader._annotationManager;
    const oldannotations = annotationManager._annotations;
    if (annotationManager._readOnly) {
        return null;
    }
    const oldannotationRects = oldannotations.map((e: any) => e.position.rects[0]).filter((e: any) => e);
    const rect = positionPdf.rects[0];
    //判断相交,并
    const rectOlds = oldannotationRects.filter((rectOld: number[]) => quickIntersectRect(rectOld, rect));

    if (rectOlds.length) {
        let expandRect: number[] = [...rect];
        rectOlds.filter((rectOld: number[]) => { expandRect = expandBoundingBox(expandRect, rectOld, pages[positionPdf.pageIndex]); });
        positionPdf.rects[0] = expandRect;
    } else {
        //跳过宽或高小于1cm的形状
        if (Math.abs(rect[2] - rect[0]) <= 10 || Math.abs(rect[3] - rect[1]) <= 10) {
            return null;
        }
    }



    const annotation: any = {};
    annotation.color = color || "#ffd400";
    annotation.type = type || "image";
    annotation.position = positionPdf;
    annotation.pageLabel = pageLabel || '';
    annotation.sortIndex = sortIndex || getSortIndex((await prepareReader("pagesLoaded"))("pdfPages"), positionPdf);
    //防止重复添加相同的注释
    if (oldannotations.find((e: any) => e.sortIndex == annotation.sortIndex)) {
        return;
    }
    //判断是否包裹被包裹
    /* const idsWraped=[]
    const wrap = (){
        oldannotations.filter((e:any)=>{
           const oldRect = e.position
        })
    }
    
        if(wrapOld==1){
            return;
        }
        if(wrapOld>1){
            annotationManager._onDelete(idsWraped);
        } */

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

export async function clearAnnotations(action: "delete" | "show" | "hidden", range: "all" | "selected") {
    const reader = (await prepareReader("pagesLoaded"))("reader");
    const attachment = reader._item;
    if (!attachment.isPDFAttachment()) { return; }
    const annotationManager = reader._internalReader._annotationManager;
    const annotations: any[] = annotationManager._annotations;
    const allIDs = annotations.map((a: any) => a.id).filter((id: any) => id);
    const selectedAnnotationIDs = reader._internalReader._primaryView._selectedAnnotationIDs;
    let ids: any;
    if (range == "all") {
        ids = allIDs;
    } else {
        ids = selectedAnnotationIDs;
    }
    const affectedAnnotations = annotations.filter((e: any) => ids.includes(e.id));
    if (action == "delete") {
        annotationManager._onDelete(ids);
        if (range == "all") {
            annotations.length = 0;
        } else {
            reader._internalReader.deleteAnnotations(ids);
        }
    }
    if (action == "show") {
        if (range == "selected") {
            if (annotationManager.hiddenSelectedIDs) {
                const temp = annotations.filter((e: any) => annotationManager.hiddenSelectedIDs.includes(e.id));
                temp.filter(x => { x._hidden = false; });
            } else {
                return;
            }
        } else {
            affectedAnnotations.filter(x => { x._hidden = false; });
        }
    }
    if (action == "hidden") {
        affectedAnnotations.filter(x => { x._hidden = true; });
        if (range == "selected") {
            annotationManager.hiddenSelectedIDs = ids;
        }
    }
    annotationManager.render();

}