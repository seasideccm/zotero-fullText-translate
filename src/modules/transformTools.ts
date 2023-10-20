//@ts-nocheck
export function getSortIndex(pdfPages: any, position: any) {
	const { pageIndex } = position;
	let offset = 0;
	let top = 0;
	if (pdfPages[position.pageIndex]) {
		const chars = getFlattenedCharsByIndex(pdfPages, position.pageIndex);
		const viewBox = pdfPages[position.pageIndex].viewBox;
		const rect = getPositionBoundingRect(position);
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

function getFlattenedCharsByIndex(pdfPages, pageIndex) {
	const structuredText = pdfPages[pageIndex].structuredText;
	return flattenChars(structuredText);
}

function getClosestOffset(chars, rect) {
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


export function flattenChars(structuredText) {
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


export function getPositionBoundingRect(position, pageIndex?) {
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
			Math.min(...rects.map(x => x[0])),
			Math.min(...rects.map(x => x[1])),
			Math.max(...rects.map(x => x[2])),
			Math.max(...rects.map(x => x[3]))
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

export function getRotationTransform(rect, degrees) {
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

export function getAxialAlignedBoundingBox(r, m) {
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

export function applyTransform(p, m) {
	const xt = p[0] * m[0] + p[1] * m[2] + m[4];
	const yt = p[0] * m[1] + p[1] * m[3] + m[5];
	return [xt, yt];
}

/* const p1 = [0, 0];
const p2 = [335.5, 28.25];
const transform = [1, 0, 0, 1, 169.25, 673.5];
const pp1 = applyTransform(p1, transform);
const pp2 = applyTransform(p2, transform);
console.log(pp1);
console.log(pp2); */

function rectsDist([ax1, ay1, ax2, ay2], [bx1, by1, bx2, by2]) {
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