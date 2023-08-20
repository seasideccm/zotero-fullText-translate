
export interface IAnnotation {
    type?: string;
    color?: string;
    pageLabel?: string;
    position?: IPosition;
    sortIndex?: string;
    text?: string;
    comment?: string;
    tags?: Array<unknown>;
    id?: string;
    dateCreated?: string;
    dateModified?: string;
    image?: string;
    key?: string;
}
export interface IPosition {
    pageIndex?: number;
    rects?: Array<IRects>;
}
export type IRects = (number)[];
import {fullTextTranslatedir,OS} from "../utils/prefs"



export function saveAnnotationImage() {
    
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
    const wr = (reader._iframeWindow as any).wrappedJSObject;
    const annotations: IAnnotation[] = (wr._reader._state.annotations).filter((ann: IAnnotation) => ann.type === "image");
    
    annotations.filter(async ann => {
        const outputPath = fullTextTranslatedir + "/"+ann.key
        await wr._reader._onCopyImage(ann.image);

    });

}

export async function saveImage(dataURL:string, outputPath:string) {
    const parts = dataURL.split(',');
    if (parts[0].includes('base64')) {
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        await OS.File.writeAtomic(outputPath, u8arr);
    }

}




