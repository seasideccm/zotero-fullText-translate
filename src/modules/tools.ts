////@ts-nocheck
export function getSortIndex(pdfPages: any, position: any) {
	const { pageIndex } = position;
	let offset = 0;
	let top = 0;
	if (pdfPages[position.pageIndex]) {
		const chars = getFlattenedCharsByIndex(pdfPages, position.pageIndex);
		const viewBox = pdfPages[position.pageIndex].viewBox;
		const rect = getPositionBoundingRect(position)!;
		offset = chars.length && getClosestOffset(chars, rect) || 0;
		const pageHeight = viewBox[3] - viewBox[1];
		top = pageHeight - rect[3];
		if (top < 0) {
			top = 0;
		}
	}
	return [
		pageIndex.toString().slice(0, 5).padStart(5, '0'),
		offset.toString().slice(0, 6).padStart(6, '0'),
		Math.floor(top).toString().slice(0, 5).padStart(5, '0')
	].join('|');
}

function getFlattenedCharsByIndex(pdfPages: any[], pageIndex: number) {
	const structuredText = pdfPages[pageIndex].structuredText;
	return flattenChars(structuredText);
}

function getClosestOffset(chars: any, rect: number[]) {
	let dist = Infinity;
	let idx = 0;
	for (let i = 0; i < chars.length; i++) {
		const ch = chars[i];
		const distance = rectsDist(ch.rect, rect);
		if (distance < dist) {
			dist = distance;
			idx = i;
		}
	}
	return idx;
}


export function flattenChars(structuredText: any) {
	const flatCharsArray = [];
	for (const paragraph of structuredText.paragraphs) {
		for (const line of paragraph.lines) {
			for (const word of line.words) {
				for (const charObj of word.chars) {
					flatCharsArray.push(charObj);
				}
			}
		}
	}
	return flatCharsArray;
}


export function getPositionBoundingRect(position: any, pageIndex?: number) {
	// Use nextPageRects
	if (position.rects) {
		let rects = position.rects;
		if (position.nextPageRects && position.pageIndex + 1 === pageIndex) {
			rects = position.nextPageRects;
		}
		if (position.rotation) {
			const rect = rects[0];
			const tm = getRotationTransform(rect, position.rotation);
			const p1 = applyTransform([rect[0], rect[1]], tm);
			const p2 = applyTransform([rect[2], rect[3]], tm);
			const p3 = applyTransform([rect[2], rect[1]], tm);
			const p4 = applyTransform([rect[0], rect[3]], tm);
			return [
				Math.min(p1[0], p2[0], p3[0], p4[0]),
				Math.min(p1[1], p2[1], p3[1], p4[1]),
				Math.max(p1[0], p2[0], p3[0], p4[0]),
				Math.max(p1[1], p2[1], p3[1], p4[1]),
			];
		}
		return [
			Math.min(...rects.map((x: number[]) => x[0])),
			Math.min(...rects.map((x: number[]) => x[1])),
			Math.max(...rects.map((x: number[]) => x[2])),
			Math.max(...rects.map((x: number[]) => x[3]))
		];
	}
	else if (position.paths) {
		const x = position.paths[0][0];
		const y = position.paths[0][1];
		const rect = [x, y, x, y];
		for (const path of position.paths) {
			for (let i = 0; i < path.length - 1; i += 2) {
				const x = path[i];
				const y = path[i + 1];
				rect[0] = Math.min(rect[0], x);
				rect[1] = Math.min(rect[1], y);
				rect[2] = Math.max(rect[2], x);
				rect[3] = Math.max(rect[3], y);
			}
		}
		return rect;
	}
}

/**
 * 计算给定矩形和角度的旋转变换矩阵。
 * 一个圆是360度，2pai弧度.弧度用弧长与半径的比值来表示
 * @param rect 
 * @param degrees 
 * @returns 
 */
export function getRotationTransform(rect: number[], degrees: number) {
	degrees = degrees * Math.PI / 180;//角度转换为弧度
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

/**
 * 规范化矩形
 * @param rect 
 * @returns 
 */
function normalizeRect(rect: number[]) {
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

export function getAxialAlignedBoundingBox(r: number[], m: number[]) {
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

export function applyTransform(p: number[], m: number[]) {
	const xt = p[0] * m[0] + p[1] * m[2] + m[4];
	const yt = p[0] * m[1] + p[1] * m[3] + m[5];
	return [xt, yt];
}


function rectsDist([ax1, ay1, ax2, ay2]: number[], [bx1, by1, bx2, by2]: number[],) {
	const left = bx2 < ax1;
	const right = ax2 < bx1;
	const bottom = by2 < ay1;
	const top = ay2 < by1;

	if (top && left) {
		return Math.hypot(ax1 - bx2, ay2 - by1);
	}
	else if (left && bottom) {
		return Math.hypot(ax1 - bx2, ay1 - by2);
	}
	else if (bottom && right) {
		return Math.hypot(ax2 - bx1, ay1 - by2);
	}
	else if (right && top) {
		return Math.hypot(ax2 - bx1, ay2 - by1);
	}
	else if (left) {
		return ax1 - bx2;
	}
	else if (right) {
		return bx1 - ax2;
	}
	else if (bottom) {
		return ay1 - by2;
	}
	else if (top) {
		return by1 - ay2;
	}

	return 0;
}


export function overlaps(rect1: number[], rect2: number[], rotation: number) {
	if ([0, 180].includes(rotation)) {
		return (rect1[1] <= rect2[1] && rect2[1] <= rect1[3]
			|| rect2[1] <= rect1[1] && rect1[1] <= rect2[3]);
	}
	return (
		rect1[0] <= rect2[0] && rect2[0] <= rect1[2]
		|| rect2[0] <= rect1[0] && rect1[0] <= rect2[2]
	);
}

// Returns a rectangle [x1, y1, x2, y2] corresponding to the
// intersection of rect1 and rect2. If no intersection, returns 'null'
// The rectangle coordinates of rect1, rect2 should be [x1, y1, x2, y2]
//两个矩形相交 const rect1=[0,0,10,10]，const rect2 =[5,5,15,15]
//得到 [5, 5, 10, 10]
export function intersect(rect1: number[], rect2: number[]) {
	const xLow = Math.max(
		Math.min(rect1[0], rect1[2]),
		Math.min(rect2[0], rect2[2])
	);
	const xHigh = Math.min(
		Math.max(rect1[0], rect1[2]),
		Math.max(rect2[0], rect2[2])
	);
	if (xLow > xHigh) {
		return null;
	}
	const yLow = Math.max(
		Math.min(rect1[1], rect1[3]),
		Math.min(rect2[1], rect2[3])
	);
	const yHigh = Math.min(
		Math.max(rect1[1], rect1[3]),
		Math.max(rect2[1], rect2[3])
	);
	if (yLow > yHigh) {
		return null;
	}

	return [xLow, yLow, xHigh, yHigh];
}

/**
 * 
 * @param rect1  rectangle [x1, y1, x2, y2]
 * @param rect2  rectangle [x1, y1, x2, y2]
 * @returns 
 */
export function quickIntersectRect(rect1: number[], rect2: number[]) {
	return !(
		rect2[0] > rect1[2]
		|| rect2[2] < rect1[0]
		|| rect2[1] > rect1[3]
		|| rect2[3] < rect1[1]
	);
}



export function adjacentRect(rect1: number[], rect2: number[], tolerance?: number) {
	function correctEdgeOrder(rect: numberect[]) {
		let temp: number;
		if (rect[0] > rect[2]) {
			temp = rect[0];
			rect[0] = rect[2];
			rect[2] = temp;
		}
		if (rect[1] > rect[3]) {
			temp = rect[1];
			rect[1] = rect[3];
			rect[3] = temp;
		}
		return rect;
	}
	rect1 = correctEdgeOrder(rect1);
	rect2 = correctEdgeOrder(rect2);
	if (!tolerance || tolerance == 0) {
		return ((
			rect2[0] >= rect1[2]
			|| rect2[2] <= rect1[0]
			|| rect2[1] >= rect1[3]
			|| rect2[3] <= rect1[1]
		) && (
				rect2[0] == rect1[2]
				|| rect2[2] == rect1[0]
				|| rect2[1] == rect1[3]
				|| rect2[3] == rect1[1]
			));
	} else {
		return ((
			rect2[0] >= rect1[2] + tolerance
			|| rect2[2] <= rect1[0] + tolerance
			|| rect2[1] >= rect1[3] + tolerance
			|| rect2[3] <= rect1[1] + tolerance
		) && (
				rect2[0] - rect1[2] <= tolerance && rect2[0] - rect1[2] >= 0
				|| rect2[2] - rect1[0] <= tolerance && rect2[2] - rect1[0] >= 0
				|| rect2[1] - rect1[3] <= tolerance && rect2[1] - rect1[3] >= 0
				|| rect2[3] - rect1[1] <= tolerance && rect2[3] - rect1[1] >= 0
			));
	}
	//未考虑负数和旋转

}

export function getPosition(p: number[], m: number[]) {
	const p1 = applyTransform([p[0], p[1]], m);
	const p2 = applyTransform([p[2], p[3]], m);
	return [p1[0], p1[1], p2[0], p2[1]];
}


/**
 * 拓展两个矩形的边界 如果坐标超出边界，取边界值
 * @param r1 
 * @param rect2 
 * @param page 
 * @returns 
 */
export function expandBoundingBox(rect1: number[], rect2: number[], viewBox: number[]) {
	/* let [left, bottom, right, top] = page.originalPage.viewport.viewBox;
	originalPage==pageView==_pages[i]
	F:\zotero\zotero-client\reader\src\pdf\pdf-view.js */
	const [left, bottom, right, top] = viewBox;
	const rect: number[] = [];
	rect[0] = Math.max(Math.min(rect1[0], rect2[0]), left);
	rect[1] = Math.max(Math.min(rect1[1], rect2[1]), bottom);
	rect[2] = Math.min(Math.max(rect1[2], rect2[2]), right);
	rect[3] = Math.min(Math.max(rect1[3], rect2[3]), top);
	//rect.push(r0, r1, rect2, rect3);

	return [Math.max(Math.min(r1[0], rect2[0]), left),
	Math.max(Math.min(r1[1], rect2[1]), bottom),
	Math.min(Math.max(r1[2], rect2[2]), right),
	Math.min(Math.max(r1[3], rect2[3]), top)];
}


function charHeight(char) {
	return ([0, 180].includes(char.rotation) && char.rect[3] - char.rect[1]
		|| [90, 270].includes(char.rotation) && char.rect[2] - char.rect[0]);
}

function getBoundingRect(objs, from, to) {
	const objs2 = objs.slice(from, to + 1);
	return [
		Math.min(...objs2.map(x => x.rect[0])),
		Math.min(...objs2.map(x => x.rect[1])),
		Math.max(...objs2.map(x => x.rect[2])),
		Math.max(...objs2.map(x => x.rect[3])),
	];
}

function roundRect(rect) {
	return rect.map(n => Math.round(n * 1000) / 1000);
}


export const invertKeyValues = obj =>
	Object.keys(obj).reduce((acc, key) => {
		acc[obj[key]] = key;
		return acc;
	}, {});