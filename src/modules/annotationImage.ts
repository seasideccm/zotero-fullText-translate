
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
import { Blob } from "buffer";
import { fullTextTranslatedir, getPathDir, OS } from "../utils/prefs";



export function saveAnnotationImage() {

	const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
	const wr = (reader._iframeWindow as any).wrappedJSObject;
	const annotations: IAnnotation[] = (wr._reader._state.annotations).filter((ann: IAnnotation) => ann.type === "image");

	annotations.filter(async ann => {
		const outputPath = fullTextTranslatedir + "/" + ann.key;
		await wr._reader._onCopyImage(ann.image);

	});

}





export async function saveImage(dataURL: string, outputPath: string) {
	if (!dataURL) return;
	const parts = dataURL.split(',');
	if (!parts[0].includes('base64')) return;
	const mime = parts[0].match(/:(.*?);/)![1];
	const bstr = atob(parts[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	//事先建好目录可以保存，图片大小适中
	await OS.File.writeAtomic(outputPath, u8arr);
	return {
		u8arr: u8arr,
		mime: mime
	};


}



/* var destCtx = destinationCanvas.getContext('2d');
destCtx.drawImage(sourceCanvas, 150,200,200,100);
var dataUrl =destCtx.toDataURL('image/png');

var canvas = $('#myCanvas')[0];
var context = canvas.getContext('2d');
var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
var worker = new Worker('myWorker.js');
worker.postMessage({
  image: imageData
});
worker.onmessage = function(e) {
  var blob = new Blob( [e.data.data], {type: 'image/jpeg'} );
  // use blob
} */

/* export async function getImage(){
	//let image = await this._renderAnnotationImage(annotation)
	async _renderAnnotationImage(annotation) {
		let { position, color } = annotation;

		let page = await this._pdfView._iframeWindow.PDFViewerApplication.pdfDocument.getPage(position.pageIndex + 1);

		// Create a new position that just contains single rect that is a bounding
		// box of image or ink annotations
		let expandedPosition = { pageIndex: position.pageIndex };
		if (position.rects) {
			// Image annotations have only one rect
			expandedPosition.rects = position.rects;
		}
		// paths
		else {
			let rect = getPositionBoundingRect(position);
			rect = [
				rect[0] - PATH_BOX_PADDING,
				rect[1] - PATH_BOX_PADDING,
				rect[2] + PATH_BOX_PADDING,
				rect[3] + PATH_BOX_PADDING
			];

			if (rect[2] - rect[0] < MIN_PATH_BOX_SIZE) {
				let x = rect[0] + (rect[2] - rect[0]) / 2;
				rect[0] = x - MIN_PATH_BOX_SIZE;
				rect[2] = x + MIN_PATH_BOX_SIZE;
			}

			if (rect[3] - rect[1] < MIN_PATH_BOX_SIZE) {
				let y = rect[1] + (rect[3] - rect[1]) / 2;
				rect[1] = y - MIN_PATH_BOX_SIZE;
				rect[3] = y + MIN_PATH_BOX_SIZE;
			}

			expandedPosition.rects = [fitRectIntoRect(rect, page.view)];
		}

		let rect = expandedPosition.rects[0];
		let maxScale = Math.sqrt(
			this._pdfView._iframeWindow.PDFViewerApplication.pdfViewer.maxCanvasPixels
			/ ((rect[2] - rect[0]) * (rect[3] - rect[1]))
		);
		let scale = Math.min(SCALE, maxScale);

		expandedPosition = p2v(expandedPosition, page.getViewport({ scale }));
		rect = expandedPosition.rects[0];

		let viewport = page.getViewport({ scale, offsetX: -rect[0], offsetY: -rect[1] });
		position = p2v(position, viewport);

		let canvasWidth = (rect[2] - rect[0]);
		let canvasHeight = (rect[3] - rect[1]);

		let canvas = this._pdfView._iframeWindow.document.createElement('canvas');
		let ctx = canvas.getContext('2d', { alpha: false });

		if (!canvasWidth || !canvasHeight) {
			return '';
		}

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		canvas.style.width = canvasWidth + 'px';
		canvas.style.height = canvasHeight + 'px';

		let renderContext = {
			canvasContext: ctx,
			viewport: viewport
		};

		await page.render(renderContext).promise;

		if (position.paths) {
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.lineWidth = position.width;
			ctx.beginPath();
			ctx.strokeStyle = color;
			for (let path of position.paths) {
				for (let i = 0; i < path.length - 1; i += 2) {
					let x = path[i];
					let y = path[i + 1];

					if (i === 0) {
						ctx.moveTo(x, y);
					}
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}

		let image = canvas.toDataURL('image/png', 1);

		// Zeroing the width and height causes Firefox to release graphics
		// resources immediately, which can greatly reduce memory consumption. (PDF.js)
		canvas.width = 0;
		canvas.height = 0;

		return image;
	}
} */


export function copyImage(u8arr: Uint8Array, mime: string) {
	const imgTools = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools);
	const transferable = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
	const clipboardService = Components.classes['@mozilla.org/widget/clipboard;1'].getService(Components.interfaces.nsIClipboard);
	const img = imgTools.decodeImageFromArrayBuffer(u8arr.buffer, mime);
	transferable.init(null);
	const kNativeImageMime = 'application/x-moz-nativeimage';
	transferable.addDataFlavor(kNativeImageMime);
	transferable.setTransferData(kNativeImageMime, img);
	clipboardService.setData(transferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);

}



export async function testSaveImg() {
	const path = getPathDir("testImg2", "f:\\testImg\\", ".png").path;
	const dataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAABb0lEQVRIS2NkGCDAOED2MoxaTLeQHw1q+gf1fwaGLKCtikTafB+obhcwnu4QqR5DGTyOgRafAsqakmjQHqD6cKAh70jUh8jHZFoMsu8FEGuTajkuH88BSqRi8wXQgaBQKQPiECR5nOpxhQTJFsMMAjqgG8gugfK/Ag3iISW4KbHYHWjRDiTLhEkJbkosBgU5KEHCAN0sBmW/qVBbbwFpS5r7GBi/KkCLDgOxBNTibKCl06gRxyAfbMJhkAFQ3AVJrgdoaSkploLUUlqAnAaa4UFKEMMcSKnFMHNAlu8kxdckp2pg/AoBLXAD4kYgVkOyzAxoGCgEiAIkW4xsKloxexpomBlRtuKJY6KKQKDFEUAzliPFG9ENC0p9DMpWt5F8SXQhQqnFZBeblFqMXFHcAhqmTvM4hrZYYEUmyL5qoMVtlFqMr+QSABruA8Sw4hJkF8ktEWoUIGuAFleS2v4i12JQiFwC4rVAA1YQG7zI6gB3t3UfUys5sgAAAABJRU5ErkJggg==";
	await saveImage(dataURL, path);

}



