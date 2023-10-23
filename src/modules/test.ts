//如果坐标超出边界，取边界值
function expand(r1: number[], r2: number[]) {
    const [left, bottom, right, top] = [0, 0, 595, 799];
    return [Math.max(Math.min(r1[0], r2[0]), left),
    Math.max(Math.min(r1[1], r2[1]), bottom),
    Math.min(Math.max(r1[2], r2[2]), right),
    Math.min(Math.max(r1[3], r2[3]), top)];
}


function quickIntersectRect(r1: number[], r2: number[]) {
    return !(
        r2[0] > r1[2]
        || r2[2] < r1[0]
        || r2[1] > r1[3]
        || r2[3] < r1[1]
    );
}

function adjacentRect(r1: number[], r2: number[]) {
    //未考虑负数和旋转
    return ((
        r2[0] >= r1[2]
        || r2[2] <= r1[0]
        || r2[1] >= r1[3]
        || r2[3] <= r1[1]
    ) && (
            r2[0] == r1[2]
            || r2[2] == r1[0]
            || r2[1] == r1[3]
            || r2[3] == r1[1]
        ));
}


const r1 = [10, 10, 100, 100];
const r2 = [100, 20, 120, 100];
const r3 = adjacentRect(r1, r2);
console.log('是否相邻：', r3);

console.log('是否相交：', quickIntersectRect(r1, r2))

/* 四条边
[10,10,100,10]
[10,10,10,100]
[10,100,100,100]
[100,10,100,100] */