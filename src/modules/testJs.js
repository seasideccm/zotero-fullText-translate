
const textDirect=`images:hidden ,restoreDialog ; view, maximizeDialog;contextmenu, openMeun. images2:hidden,restoreDialog;view, maximizeDialog ; contextmenu, openMeun. `
function makeArgs(textDirect){
	const reg=/\. */
	const argsByElement=textDirect.split(reg).filter(e=>e)
	const argsByElementArr=[]
	argsByElement.filter(elemantAndParas=>{
		const elementArr=[]
		const reg=/\: */
		const elemantAndParasArr=elemantAndParas.split(reg).filter(e=>e)
		//console.log("elemantAndParasArr:",elemantAndParasArr)
		elementArr.push(elemantAndParasArr[0])
		const regArgs = /\; */			
		const parasArr=elemantAndParasArr[1].split(regArgs).filter(e=>e)
		const elementParasArr=[]
		parasArr.filter(paras=>{
			const reg=/, */
			const paraArr=paras.split(reg).filter(e=>e).map(e=>e.trim())
			elementParasArr.push(paraArr)
			
			//console.log(paraArr[0],'--',typeof paraArr[0],paraArr[0].includes(' '))
		})
		elementArr.push(elementParasArr)
		argsByElementArr.push(elementArr)
		
		})
		console.log(argsByElementArr)
	}
makeArgs(textDirect)











console.log( Math.PI / 180)


function getAxialAlignedBoundingBox(r, m) {
	const p1 = applyTransform(r, m);
	const p2 = applyTransform(r.slice(2, 4), m);
	const p3 = applyTransform([r[0], r[3]], m);
	const p4 = applyTransform([r[2], r[1]], m);
	return [
		Math.min(p1[0], p2[0], p3[0], p4[0]),
		Math.min(p1[1], p2[1], p3[1], p4[1]),
		Math.max(p1[0], p2[0], p3[0], p4[0]),
		Math.max(p1[1], p2[1], p3[1], p4[1]),
	];
}

export function getRotationTransform(rect, degrees) {
	//角度转换为弧度	
	//一个圆是360度，2pai弧度.弧度用弧长与半径的比值来表示
	degrees = degrees * Math.PI / 180;
	const cosValue = Math.cos(degrees);
	const sinValue = Math.sin(degrees);
	const m = [cosValue, sinValue, -sinValue, cosValue, 0, 0];
	rect = normalizeRect(rect);
	const x1 = rect[0] + (rect[2] - rect[0]) / 2;
	const y1 = rect[1] + (rect[3] - rect[1]) / 2;
	const rect2 = getAxialAlignedBoundingBox(rect, m);
	const x2 = rect2[0] + (rect2[2] - rect2[0]) / 2;
	const y2 = rect2[1] + (rect2[3] - rect2[1]) / 2;
	const deltaX = x1 - x2;
	const deltaY = y1 - y2;
	m[4] = deltaX;
	m[5] = deltaY;
	return m;
}


function normalizeRect(rect) {
	const r = rect.slice(0); // clone rect
	if (rect[0] > rect[2]) {
		r[0] = rect[2];
		r[2] = rect[0];
	}
	if (rect[1] > rect[3]) {
		r[1] = rect[3];
		r[3] = rect[1];
	}
	return r;
}


const rect =[5,5,10,10]


const r2=normalizeRect(rect)

console.log(r2)