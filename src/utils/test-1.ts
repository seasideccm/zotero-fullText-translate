declare type DataTypeJS = "Object" | "Array" | "Function" | "Number" | "String" | "Boolean" | "Number" | "Undefined" | "Null" | "Symbol";

export const typeReal = (obj: any) => {
    return Object.prototype.toString.call(obj).match(/(\b.+?\b)/g)?.slice(-1)[0];
};
/**
 * 替换数组元素 0 - n 个的排列
 * @param arr 数组
 */
export function arrange(arr: any[], replaceText: string) {
    const arrArr: any[] = [];
    for (let i = 0; i < arr.length; i++) {
        const arr1 = arr.slice(0, i);
        arr1.filter((e, i) => arr1[i] = replaceText);
        const arr2 = arr.slice(i);
        for (let j = 0; j < arr2.length; j++) {
            arrArr.push(arr1.concat(arr2.slice(0, j).concat(replaceText).concat(arr2.slice(j + 1))));
        }
    }
    return arrArr;
}
export function createOverload() {
    const callMap = new Map();
    function overload(this: any, ...args: any[]) {
        const types = args;
        const typesArrang = arrange(types, "any");
        const kesArr = typesArrang.map((types) => types.join(','));
        const key = args.map((arg) => typeReal(arg)).join(',');
        let fn = callMap.get(key);
        if (fn) {
            return fn.apply(this, args);
        } else {
            for (const key of kesArr) {
                fn = callMap.get(key);
                if (fn) {
                    return fn.apply(this, args);
                }
            }
        }
        throw new Error("no matching function");
    }
    /**
     *  first pass each arg's type，
     * then put fn at end of args
     * @param args 
     * @returns 
     */
    overload.addImpl = function (...args: any[]) {
        const fn = args.pop();
        if (typeReal(fn) !== "Function") return;
        const types = args;
        callMap.set(types.join(','), fn);
    };
    return overload;
}

const typeJudge2 = createOverload();
typeJudge2.addImpl("any", (obj: any) => typeReal(obj));
typeJudge2.addImpl("any", "string", (obj: any, condition: DataTypeJS) => typeReal(obj) === condition);
console.log(typeJudge2({}, "Object"));