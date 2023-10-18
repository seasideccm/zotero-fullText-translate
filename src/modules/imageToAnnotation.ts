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
    internalReader._annotationManager.addAnnotation(JSON.parse(JSON.stringify(annotation)));
    const test = "test";
}



