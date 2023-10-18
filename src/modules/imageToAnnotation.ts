////@ts-nocheck
import { getInfo } from "./imageAndFontInfo";
import { prepareReader } from "./prepareReader";
export async function imageToAnnotation() {
    //window.alert("开始");
    //const PDFViewerApplication = await prepareReader("pagesLoaded");
    //const reader = Zotero.Reader.getByTabID(Zotero_Tabs._tabs[Zotero_Tabs.selectedIndex].id);
    const reader = await prepareReader("initializedReader");
    //const pdfView2 = await prepareReader("pdfView");
    //const internalReader2 = await prepareReader("internalReader");
    const internalReader = reader._internalReader;
    const pdfView: any = reader._internalReader._primaryView;

    function test22() {
        const test = "test";
    }
    (pdfView._iframeWindow as any).addEventListener('pointerup', test22.bind(pdfView));
    /*     pdfView.navigateToLastPage();
        pdfView.navigateToPreviousPage();
        pdfView.navigateToLastPage();
        pdfView.navigateToFirstPage();
        const page = pdfView._iframeWindow.PDFViewerApplication.pdfViewer._pages[0];
        const rect = page.div.getBoundingClientRect(); */
    const annotationManager = internalReader._annotationManager;
    const position = [
        100,
        664.0033112582781,
        515.807282858337,
        707.8112582781457
    ];
    const annotation: any = {
        "type": "image",
        "color": "#ffd400",
        "pageLabel": "818",
        "position": {
            "pageIndex": 0,
            "rects": [
                position
            ]
        },
        "sortIndex": "00000|002972|00048"
    };

    annotation.pageLabel = annotation.pageLabel || '';
    annotation.text = annotation.text || '';
    annotation.comment = annotation.comment || '';
    annotation.tags = annotation.tags || [];
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

    const attachment = reader._item;
    const savedAnnotation = await Zotero.Annotations.saveFromJSON(attachment, annotation);
    /* const tag = "mytag"
    savedAnnotation.addTag(tag); */
    await savedAnnotation.saveTx();


    //pdfView._onAddAnnotation(JSON.parse(JSON.stringify(annotation)));
    //internalReader._annotationManager.addAnnotation(JSON.parse(JSON.stringify(annotation)));
    //const onaddAnnotation = addAnnotation.bind(internalReader._annotationManager, JSON.parse(JSON.stringify(annotation)));
    //const onaddAnnotation = internalReader._annotationManager.addAnnotation.bind(internalReader._annotationManager, JSON.parse(JSON.stringify(annotation)));

    const test = "test";
}
/* eslint-disable*/

/* function addAnnotation(annotation: any) {

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

    annotation.id = this._generateObjectKey();
    annotation.dateCreated = (new Date()).toISOString();
    annotation.dateModified = annotation.dateCreated;

    annotation.authorName = this._authorName;

    if (this._authorName) {
        annotation.isAuthorNameAuthoritative = true;
    }
    // Ensure numbers have 3 or less decimal places
    if (annotation.position.rects) {
        annotation.position.rects = annotation.position.rects.map(

            rect => rect.map(value => parseFloat(value.toFixed(3)))
        );
    }
    //this._save(JSON.parse(JSON.stringify(annotation)));
    let _annotations = JSON.parse(JSON.stringify(this._annotations));
    let oldIndex = _annotations.findIndex(x => x.id === annotation.id);
    if (oldIndex !== -1) {
        annotation = { ...annotation };
        _annotations.splice(oldIndex, 1, annotation);
    }
    else {
        _annotations.push(annotation);
        _annotations.sort((a, b) => (a.sortIndex > b.sortIndex) - (a.sortIndex < b.sortIndex));
    }
    let _unsavedAnnotations = JSON.parse(JSON.stringify(this._unsavedAnnotations));
    _unsavedAnnotations = _unsavedAnnotations.filter(x => x.id !== annotation.id);



    _unsavedAnnotations.push(annotation);
    this._annotations = JSON.parse(JSON.stringify(_annotations));
    this._unsavedAnnotations = JSON.parse(JSON.stringify(_unsavedAnnotations));
    this._debounceSave();
    const render = this.render.bind(this);
    render();
    return annotation;
} */

/* eslint-enable */