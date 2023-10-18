import { getInfo } from "./imageAndFontInfo";
import { prepareReader } from "./prepareReader";
export async function imageToAnnotation() {
    //window.alert("开始");
    const PDFViewerApplication = await prepareReader("pagesLoaded");


    const pdfView = await prepareReader("pdfView");


    pdfView.navigateToLastPage();
    pdfView.navigateToPreviousPage();
    pdfView.navigateToLastPage();
    pdfView.navigateToFirstPage();
    const page = pdfView._iframeWindow.PDFViewerApplication.pdfViewer._pages[0];
    const rect = page.div.getBoundingClientRect();

    const internalReader = await prepareReader("internalReader");
    const annotation = {
        "type": "image",
        "color": "#ffd400",
        "pageLabel": "818",
        "position": {
            "pageIndex": 0,
            "rects": [
                [
                    162.29212736536246,
                    0,
                    498.15442244732975,
                    80.92916519915461
                ]
            ]
        },
        "sortIndex": "00000|000030|00675"
    };
    //pdfView._onAddAnnotation(anotation);
    //internalReader._annotationManager.addAnnotation(JSON.parse(JSON.stringify(annotation)));
    const onaddAnnotation = addAnnotation.bind(internalReader._annotationManager, JSON.parse(JSON.stringify(annotation)));
    onaddAnnotation();
    const test = "test";
}
/* eslint-disable*/

function addAnnotation(annotation: any) {
    // @ts-ignore
    if (this._readOnly) {
        return null;
    }

    let { color, sortIndex } = annotation;
    if (!color) {
        throw new Error(`Missing 'color' property`);
    }
    if (!sortIndex) {
        throw new Error(`Missing 'sortIndex' property`);
    }

    annotation.pageLabel = annotation.pageLabel || '';
    annotation.text = annotation.text || '';
    annotation.comment = annotation.comment || '';
    annotation.tags = annotation.tags || [];
    // @ts-ignore
    annotation.id = this._generateObjectKey();
    annotation.dateCreated = (new Date()).toISOString();
    annotation.dateModified = annotation.dateCreated;
    // @ts-ignore
    annotation.authorName = this._authorName;
    // @ts-ignore
    if (this._authorName) {
        annotation.isAuthorNameAuthoritative = true;
    }
    // Ensure numbers have 3 or less decimal places
    if (annotation.position.rects) {
        annotation.position.rects = annotation.position.rects.map(
            // @ts-ignore
            rect => rect.map(value => parseFloat(value.toFixed(3)))
        );
    }
    // @ts-ignore
    this._save(JSON.parse(JSON.stringify(annotation)));
    // @ts-ignore
    this.render();
    return annotation;
}
/* eslint-enable */