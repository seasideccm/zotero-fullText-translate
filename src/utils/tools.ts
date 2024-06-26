

/**
 * 对象工厂
 * @param keys 数组或嵌套数组
 * @param arrs 数组或嵌套数组
 * @returns 
 * @example
 * ```
 * keys:["id","name",["attributes",["age","height"]]]
 * values:["1","jhon",["18","170cm"]]
 * or
 * values：[["1","jhon",["18","170cm"]],["2","mike",["22","168cm"]]]
 * ```
 */
export function objFactory(keys: any[], valures: any[]) {
	const objArr: any[] = [];
	if (!Array.isArray(valures[0])) {
		valures = [valures];
	}
	valures.forEach((arr) => {
		objArr.push(_objFactory(keys, arr));
	});
	function _objFactory(ks: any[], vs: any[]) {
		if (typeof vs == "string") {
			vs = [vs];
		}
		const obj: any = {};
		ks.forEach((key, i: number) => {
			if (typeof key !== "string") {
				const k = key[0];
				const subKeys = key[1];

				const subobj = _objFactory(subKeys, vs[i]);
				Object.assign(obj, { [k]: subobj });
				;
			} else {
				Object.assign(obj, { [key]: vs[i] });
			}
		});
		return obj;
	}
	return objArr;
}



/* const keys = ["id", "name", ["attributes", ["age", "height"]]];

const vals = [["1", "jhon", ["18", "170cm"]], ["2", "mike", ["22", "168cm"]]];

const ooo = objFactory(keys, vals);
console.log(ooo); */

/**
 * 给定数据，返回其类型的小写名称
 * @param obj 
 * @returns type name string in lowerCase
 */
export function typeReal(obj: any) {
	return Object.prototype.toString.call(obj).match(/(\b.+?\b)/g)!.slice(-1)[0].toLowerCase();
};

export function objsAddKVFactory(option: {
	commonProps: any;
	privatePropsArr: any[];
}) {
	const result: any[] = [];
	option.privatePropsArr.filter((obj: any) => {
		result.push(objectDeepMerge(obj, option.commonProps));
	});
	return result;

}

export function objectDeepMerge(target: any, ...sources: any[]) {
	function compareType(a: any, b: any) {
		return Object.prototype.toString.call(a) === Object.prototype.toString.call(b);
	}
	sources.forEach(source => {
		Object.keys(source).forEach(key => {
			if (!target[key] || !compareType(target[key], source[key])) {
				//目标对象无此键，添加此键值，或目标和来源对象有同名键，但值类型不同时，后者覆盖前者
				Object.assign(target, { [key]: source[key] });
			} else {
				if (Array.isArray(source[key])) {
					//值为数组（包括对象构成的数组）
					target[key] = target[key].concat(source[key]);
				} else if (source[key] instanceof Object) {
					if (target[key] !== source[key]) {
						objectDeepMerge(target[key], source[key]);
					}
				} else {
					Object.assign(target, { [key]: source[key] });
				}
			}
		});
	});
	return target;
}

export function deepClone(value: any) {
	const cache = new WeakMap();
	function _deepClone(value: any) {
		if (value === null || typeof value !== "object") {
			return value;
		}
		if (cache.has(value)) {
			return cache.get(value);
		}
		const result: any = Array.isArray(value) ? [] : {};
		cache.set(value, result);
		for (const key in value) {
			if ((value.hasOwnProperty(key))) {
				result[key] = _deepClone(value[key]);
			}
		}
		return result;
	}
	return _deepClone(value);
}


//Reflect.ownKeys 返回正常的属性名，也返回不可枚举属性以及Symbol属性
export const isEmptyObj = (obj: any) => Reflect.ownKeys(obj).length === 0;

/**
 * 不区分大小写
 */
declare type DataTypeJS = "object" | "array" | "function" | "number" | "string" | "boolean" | "number" | "undefined" | "null" | "symbol" | "Object" | "Array" | "Function" | "Number" | "String" | "Boolean" | "Number" | "Undefined" | "Null" | "Symbol";
/* interface TypeJudge {
	typeJudge(arg: any): string;
	typeJudge(arg1: any, arg2: DataTypeJS): boolean;
} */

export function typeJudge(arg: any): string;
export function typeJudge(arg1: any, arg2: DataTypeJS): boolean;
export function typeJudge(
	arg1: any,
	arg2?: DataTypeJS
): string | boolean | undefined {
	return arg2 ? typeReal(arg1) === arg2.toLowerCase() : typeReal(arg1);
}


//console.log(typeJudge("good", "number"));


//函数，接口，重载


declare type Func = (...argsFn: any[]) => any | void;
interface AddImpl {
	(func: Func, ...args: string[]): void;
}
interface Overload {
	//类型判断
	(arg: any): string;
	//判断是否为指定类型
	(arg: any, arg2: string): boolean;
	addImpl: AddImpl;

}
/* interface CreateOverload {
	():Overload;
	overload: Overload;

} */



export function createOverload(): Overload {
	const callMap = new Map();
	const overload: Overload = (...args: any[]) => {
		//map的所有键（类型名称数组）组成数组
		const callMapKeys = [...callMap.keys()];
		//函数调用传递的参数转换为类型名称后匹配 map 的键
		const key = findMapKey(args)(callMapKeys)()("any");
		if (!key) throw new Error("no matching function");
		return callMap.get(key).apply(this, args);
	};
	//任意参数类型名称组成的数组作为 map 的键
	overload.addImpl = function (func: Func, ...args: string[]) {
		if (typeReal(func) !== "function") return;
		callMap.set(args, func);
	};
	return overload;

};

/**
 * 在数组中查找与参数列表各项类型相同的项
 * @param args 参数列表
 * @returns 
 */
function findMapKey(args: any[]) {
	return getSTA;
	/**
	 * 
	 * @param specifiedTypesArr 数组的项为类型名称，以"," 间隔的符串或字符串数组
	 * @returns 
	 */
	function getSTA(specifiedTypesArr: any[]) {
		return typeConvert;
		/**
		 * 
		 * @param isConvert 参数是否转换为类型名称，默认 true
		 * @returns 
		 */
		function typeConvert(isConvert: boolean = true) {
			return getString;
			/**
			 * 
			 * @param excludeElement 可选, 如"any"类型（查找相同数组时，可以是其他想要忽略的字符串）
			 * @returns 
			 */
			function getString(excludeElement?: string) {
				let argsTypes;
				isConvert ? argsTypes = args.map((arg) => typeReal(arg)) : argsTypes = args;
				specifiedTypesArr = specifiedTypesArr.filter((e => e.length == argsTypes.length));
				for (const specifiedTypes of specifiedTypesArr) {
					let specifiedItems;
					if (typeReal(specifiedTypes) !== "array") {
						specifiedItems = specifiedTypes.split(",");
					} else {
						specifiedItems = [...specifiedTypes];
					}
					let find = true;
					while (specifiedItems.length) {
						const argType = argsTypes.shift();
						const specifiedType = specifiedItems.shift();
						if (specifiedType != argType) {
							if (excludeElement) {
								if (specifiedType != excludeElement) {
									find = false;
									break;
								}
							} else {
								find = false;
								break;
							}
						}
					}
					if (find) {
						return specifiedTypes;
					}
				}
			}

		};
	};

}
export const typeIdentify = createOverload();
const getTypeName = (obj: any) => typeReal(obj);
const isTypeName = (obj: any, condition: DataTypeJS) => typeReal(obj) === condition.toLowerCase();
typeIdentify.addImpl(getTypeName, "any");
typeIdentify.addImpl(isTypeName, "any", "string",);
//typeIdentify({});




/**
 * 获取函数的形参个数
 * @param  {Function} func [要获取的函数]
 * @return {*}             [形参的数组或undefind]
 */
function getFuncParameters(func: any) {
	if (typeof func == 'function') {
		const mathes = /[^(]+\(([^)]*)?\)/gm.exec(Function.prototype.toString.call(func))!;
		if (mathes[1]) {
			const args = mathes[1].replace(/[^,\w]*/g, '').split(',');
			return args;
		}
	}
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




export function fileSizeFormat(fileSize: number, idx = 0) {
	const units = ["B", "KB", "MB", "GB"];
	if (fileSize < 1024 || idx === units.length - 1) {
		return fileSize.toFixed(1) + units[idx];
	}
	return fileSizeFormat(fileSize / 1024, ++idx);
}

export function combinObj(obj1: any, obj2: any) {
	Object.keys(obj2).filter((keyobj2: string) => {
		obj1[keyobj2] ? () => { } : obj1[keyobj2] = obj2[keyobj2];
	});
}

/**
 * 判断矩形是否相邻，可设定容差，单位 mm
 * @param rect1 
 * @param rect2 
 * @param tolerance_mm 
 * @returns 
 */
export function adjacentRect(rect1: number[], rect2: number[], tolerance_mm?: number) {
	function correctEdgeOrder(rect: number[]) {
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

	tolerance_mm = tolerance_mm || 0;
	if (
		!(
			rect2[0] > rect1[2] ||
			rect2[2] < rect1[0] ||
			rect2[1] > rect1[3] ||
			rect2[3] < rect1[1]
		)
	) {
		return false;
	} else {
		return !(
			(rect2[0] >= rect1[2] && rect2[0] - rect1[2] > tolerance_mm) ||
			(rect2[2] <= rect1[0] && rect1[0] - rect2[2] > tolerance_mm) ||
			(rect2[1] >= rect1[3] && rect2[1] - rect1[3] > tolerance_mm) ||
			(rect2[3] <= rect1[1] && rect1[1] - rect2[3] > tolerance_mm)
		);
	}

	//未考虑旋转

}

/**
 * 
 * @param rect 
 * @param view 
 * @param tolerancePercent 0-100
 * @returns 
 */
export function isExceedBoundary(rect: number[], view: number[], tolerancePercent: number) {
	tolerancePercent = tolerancePercent / 100;
	return (rect[0] < view[2] * tolerancePercent || rect[0] > view[2] * (1 - tolerancePercent)
		|| rect[1] < view[3] * tolerancePercent || rect[1] > view[3] * (1 - tolerancePercent)
		|| rect[2] < view[2] * tolerancePercent || rect[2] > view[2] * (1 - tolerancePercent)
		|| rect[3] < view[3] * tolerancePercent || rect[3] > view[3] * (1 - tolerancePercent));
}





/**
 * 
 * @param p pdfPoint([x1,y1,x2,y2])
 * @param m transform
 * @returns pdfRect([x1,y1,x2,y2])
 */
export function getPosition(p: number[], m: number[]) {
	if (!m || !m.length) {
		m = [1, 0, 0, 1, 0, 0];
	}
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
	//rect.push(r0, rect1, rect2, rect3);

	return [Math.max(Math.min(rect1[0], rect2[0]), left),
	Math.max(Math.min(rect1[1], rect2[1]), bottom),
	Math.min(Math.max(rect1[2], rect2[2]), right),
	Math.min(Math.max(rect1[3], rect2[3]), top)];
}



export function updateCurvePathMinMax(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, minMax: number[]) {
	const box = bezierBoundingBox(x0, y0, x1, y1, x2, y2, x3, y3);
	if (minMax) {
		minMax[0] = Math.min(minMax[0], box[0], box[2]);
		minMax[1] = Math.max(minMax[1], box[0], box[2]);
		minMax[2] = Math.min(minMax[2], box[1], box[3]);
		minMax[3] = Math.max(minMax[3], box[1], box[3]);
		return;
	}
	// , transform?: number[] this.updateRectMinMax(transform, box);
}
/* function updateRectMinMax(transform, rect) {
	const p1 = Util.applyTransform(rect, transform);
	const p2 = Util.applyTransform(rect.slice(2), transform);
	this.minX = Math.min(this.minX, p1[0], p2[0]);
	this.minY = Math.min(this.minY, p1[1], p2[1]);
	this.maxX = Math.max(this.maxX, p1[0], p2[0]);
	this.maxY = Math.max(this.maxY, p1[1], p2[1]);
} */

function bezierBoundingBox(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
	const tvalues = [],
		bounds: number[][] = [[], []];
	let a, b, c, t, t1, t2, b2ac, sqrtb2ac;
	for (let i = 0; i < 2; ++i) {
		if (i === 0) {
			b = 6 * x0 - 12 * x1 + 6 * x2;
			a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
			c = 3 * x1 - 3 * x0;
		} else {
			b = 6 * y0 - 12 * y1 + 6 * y2;
			a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
			c = 3 * y1 - 3 * y0;
		}
		if (Math.abs(a) < 1e-12) {
			if (Math.abs(b) < 1e-12) {
				continue;
			}
			t = -c / b;
			if (0 < t && t < 1) {
				tvalues.push(t);
			}
			continue;
		}
		b2ac = b * b - 4 * c * a;
		sqrtb2ac = Math.sqrt(b2ac);
		if (b2ac < 0) {
			continue;
		}
		t1 = (-b + sqrtb2ac) / (2 * a);
		if (0 < t1 && t1 < 1) {
			tvalues.push(t1);
		}
		t2 = (-b - sqrtb2ac) / (2 * a);
		if (0 < t2 && t2 < 1) {
			tvalues.push(t2);
		}
	}

	let j = tvalues.length,
		mt;
	const jlen = j;
	while (j--) {
		t = tvalues[j];
		mt = 1 - t;
		bounds[0][j] =
			mt * mt * mt * x0 +
			3 * mt * mt * t * x1 +
			3 * mt * t * t * x2 +
			t * t * t * x3;
		bounds[1][j] =
			mt * mt * mt * y0 +
			3 * mt * mt * t * y1 +
			3 * mt * t * t * y2 +
			t * t * t * y3;
	}

	bounds[0][jlen] = x0;
	bounds[1][jlen] = y0;
	bounds[0][jlen + 1] = x3;
	bounds[1][jlen + 1] = y3;
	bounds[0].length = bounds[1].length = jlen + 2;

	return [
		Math.min(...bounds[0]),
		Math.min(...bounds[1]),
		Math.max(...bounds[0]),
		Math.max(...bounds[1]),
	];
}








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




function charHeight(char: any) {
	return ([0, 180].includes(char.rotation) && char.rect[3] - char.rect[1]
		|| [90, 270].includes(char.rotation) && char.rect[2] - char.rect[0]);
}

function getBoundingRect(objs: any, from: number, to: number) {
	const objs2 = objs.slice(from, to + 1);
	return [
		Math.min(...objs2.map((x: any) => x.rect[0])),
		Math.min(...objs2.map((x: any) => x.rect[1])),
		Math.max(...objs2.map((x: any) => x.rect[2])),
		Math.max(...objs2.map((x: any) => x.rect[3])),
	];
}

function roundRect(rect: number[]) {
	return rect.map(n => Math.round(n * 1000) / 1000);
}


export const invertKeyValues = (obj: any) =>
	Object.keys(obj).reduce((acc: any, key: string) => {
		acc[obj[key]] = key;
		return acc;
	}, {});


//数组单元素是非全排列 2^n
export function arrange(arr: any[], replaceText: string | number) {
	//console.log("数组长度：",arr.length)
	let arrArr: any[] = [];
	arrArr.push(arr);
	for (let i = 0; i < arr.length; i++) {
		const temp: any[] = [];
		for (const arrElement of arrArr) {
			const arrReplace = [...arrElement];
			arrReplace[i] = 5;
			temp.push(arrReplace);
		}
		arrArr = arrArr.concat(temp);
	}
	return arrArr;
}
//const arrTest = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function fib(n: number, n1 = 1, n2 = 1) {
	if (n <= 2) {
		return n2;
	}
	return fib(n - 1, n2, n1 + n2);
}

/* export function isArray(obj: any) {
	if (Array.isArray) {
		return Array.isArray(obj);
	} else {
		return Object.prototype.toString.call(obj) === '[object Array]';
	}
} 

const isPlainObject = (obj: any) => Object.prototype.toString.call(obj) === '[object Object]';

*/

export function utf8Encode(string: string) {
	string = string.replace(/\r\n/g, "\n");
	let utftext = "";

	for (let n = 0; n < string.length; n++) {

		const c = string.charCodeAt(n);

		if (c < 128) {
			utftext += String.fromCharCode(c);
		}
		else if ((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}

	}

	return utftext;
}

export function utf8Decode(utftext: string) {
	let string = "";
	let i = 0;
	let c = 0;
	const c1 = 0;
	let c2 = 0;
	let c3;

	while (i < utftext.length) {

		c = utftext.charCodeAt(i);

		if (c < 128) {
			string += String.fromCharCode(c);
			i++;
		}
		else if ((c > 191) && (c < 224)) {
			c2 = utftext.charCodeAt(i + 1);
			string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		}
		else {
			c2 = utftext.charCodeAt(i + 1);
			c3 = utftext.charCodeAt(i + 2);
			string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}

	}

	return string;
}