import { getSortIndex, applyTransform } from "./transformTools";
import { getPDFInfo } from "./imageTableFontInfo";
import { prepareReader } from "./prepareReader";
export async function imageToAnnotation() {
    const infoDataArr = await getPDFInfo();
    const imgDataArr = infoDataArr.imgDataArr;
    if (!imgDataArr.length) { return; }
    const pages = (await prepareReader("pagesLoaded"))("pages");
    imgDataArr.forEach((imgData: any) => {
        const transform = imgData.transform;
        /*pdf坐标系以左下角为（0,0），每个对象均视为单位大小1，
        根据该对象的transform确定坐标系中的位置,
        对左下角和右上角两点应用transform，得到坐标的具体值*/

        //const positionPdf: any = getPosition([0, 0, 1, 1], transform, imgData.pageId - 1);
        //初始rect,逐次应用transform，每次返回rect，重新对rect赋值
        if (!transform.length) {
            return;
        }
        let rect: number[] = [0, 0, 1, 1];
        transform.filter((e: any) => { rect = getPosition(rect, e); });
        const positionPdf: any = {
            rects: [rect],
            pageIndex: imgData.pageId - 1
        };
        makeAnnotation(positionPdf);
    });

    const tableArr = infoDataArr.tableArr;
    const cache: number[][] = [];
    tableArr.forEach((tablePathData: any[]) => {
        const view = pages[tablePathData[0].pageId - 1].pdfPage.view;
        const type = tablePathData[0].type;
        //先跳过曲线
        if (type == "curve") { return; }
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
            if (pathData.type == "rectangle") {
                p1sx.push(...args.filter((e: number, i: number) => i % 4 == 0));
                p1sy.push(...args.filter((e: number, i: number) => i % 4 == 1));
                p2sx.push(...p1sx.map((e: number, i: number) => e + args[i * 4 + 2]));
                p2sy.push(...p1sy.map((e: number, i: number) => e + args[i * 4 + 3]));
            }
            //直线坐标是两个点

            if (pathData.type == "line") {
                p1sx.push(...args.filter((e: number, i: number) => i % 4 == 0));
                p1sy.push(...args.filter((e: number, i: number) => i % 4 == 1));
                p2sx.push(...args.filter((e: number, i: number) => i % 4 == 2));
                p2sy.push(...args.filter((e: number, i: number) => i % 4 == 3));
            }
        });
        const p1x = Math.min(...p1sx);
        const p1y = Math.min(...p1sy);
        const p2x = Math.max(...p2sx);
        const p2y = Math.max(...p2sy);
        //提取路径时已经根据矩形和线条归类，剔除了曲线，超过边界
        if (p1x < view[2] * 0.05 || p1x > view[2] * 0.95
            || p2x < view[2] * 0.05 || p2x > view[2] * 0.95
            || p1y < view[3] * 0.05 || p1y > view[3] * 0.95
            || p2y < view[3] * 0.05 || p2y > view[3] * 0.95) {
            return;
        }

        //跳过宽和高度小于1cm
        if (Math.abs(p2x - p1x) <= 10 && Math.abs(p2y - p1y) <= 10) {
            return;//退出当前循环，继续下一个元素
        }

        const transform = tablePathData[0].transform || [1, 0, 0, 1, 0, 0];
        const rect = getPosition([p1x, p1y, p2x, p2y], transform);
        //判断相交
        const positionPdf: any = {
            rects: [rect],
            pageIndex: pageId - 1
        };
        makeAnnotation(positionPdf);
    });

    function getPosition(p: number[], m: number[]) {
        const p1 = applyTransform([p[0], p[1]], m);
        const p2 = applyTransform([p[2], p[3]], m);
        return [p1[0], p1[1], p2[0], p2[1]];
    }

}

export async function makeAnnotation(positionPdf: any[], type?: string, color?: string, pageLabel?: string
    , sortIndex?: string, tag?: string) {
    const reader = (await prepareReader("pagesLoaded"))("reader");
    const attachment = reader._item;
    if (!attachment.isPDFAttachment()) { return; }
    const annotationManager = reader._internalReader._annotationManager;
    const oldannotations = annotationManager._annotations;
    if (annotationManager._readOnly) {
        return null;
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

export async function clearAnnotations(action: "delete" | "show" | "hidden") {
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
    if (action == "delete") {
        annotationManager._onDelete(ids);
        annotations.length = 0;
    }
    if (action == "show") {
        annotations.filter(x => { x._hidden = false; });
    }
    if (action == "hidden") {
        annotations.filter(x => { x._hidden = true; });
    }
    annotationManager.render();

}