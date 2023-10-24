import { OPS } from "../utils/config";

class OPSAction {
    name: string;
    constructor(

    ) {
        this.name = "canvasCtx";
    }
    setLineWidth() {
    }
    setLineCap() {
    }
    setLineJoin() {
    }
    setMiterLimit() {
    }
    setDash() {
    }
    setRenderingIntent() {
    }
    setFlatness() {
    }
    setGState() {
    }
    save() {
    }
    restore() {
    }
    transform() {
    }
    moveTo() {
    }
    lineTo() {
    }
    curveTo() {
    }
    curveTo2() {
    }
    curveTo3() {
    }
    closePath() {
    }
    rectangle() {
    }
    stroke() {
    }
    closeStroke() {
    }
    fill() {
    }
    eoFill() {
    }
    fillStroke() {
    }
    eoFillStroke() {
    }
    closeFillStroke() {
    }
    closeEOFillStroke() {
    }
    endPath() {
    }
    clip() {
    }
    eoClip() {
    }
    beginText() {
    }
    endText() {
    }
    setCharSpacing() {
    }
    setWordSpacing() {
    }
    setHScale() {
    }
    setLeading() {
    }
    setFont() {
    }
    setTextRenderingMode() {
    }
    setTextRise() {
    }
    moveText() {
    }
    setLeadingMoveText() {
    }
    setTextMatrix() {
    }
    nextLine() {
    }
    showText() {
    }
    showSpacedText() {
    }
    nextLineShowText() {
    }
    nextLineSetSpacingShowText() {
    }
    setCharWidth() {
    }
    setCharWidthAndBounds() {
    }
    setStrokeColorSpace() {
    }
    setFillColorSpace() {
    }
    setStrokeColor() {
    }
    setStrokeColorN() {
    }
    setFillColor() {
    }
    setFillColorN() {
    }
    setStrokeGray() {
    }
    setFillGray() {
    }
    setStrokeRGBColor() {
    }
    setFillRGBColor() {
    }
    setStrokeCMYKColor() {
    }
    setFillCMYKColor() {
    }
    shadingFill() {
    }
    beginInlineImage() {
    }
    beginImageData() {
    }
    endInlineImage() {
    }
    paintXObject() {
    }
    markPoint() {
    }
    markPointProps() {
    }
    beginMarkedContent() {
    }
    beginMarkedContentProps() {
    }
    endMarkedContent() {
    }
    beginCompat() {
    }
    endCompat() {
    }
    paintFormXObjectBegin() {
    }
    paintFormXObjectEnd() {
    }
    beginGroup() {
    }
    endGroup() {
    }
    beginAnnotation() {
    }
    endAnnotation() {
    }
    paintImageMaskXObject() {
    }
    paintImageMaskXObjectGroup() {
    }
    paintImageXObject() {
    }
    paintInlineImageXObject() {
    }
    paintInlineImageXObjectGroup() {
    }
    paintImageXObjectRepeat() {
    }
    paintImageMaskXObjectRepeat() {
    }
    paintSolidColorImageMask() {
    }
    constructPath() {
    }
}

/* for (const op in OPS) {
    if (OPSAction.prototype[op] !== undefined) {
        OPSAction.prototype[OPS[op]] = OPSAction.prototype[op];
    }
}

export { OPSAction };
 */
/* function dealPath(i: number) {
    if (fnArray[i] == OPS.constructPath) {
        const args: number[][] = argsArray[i];
        const fn: number[] = args[0];
        const fnArgs: number[] = args[1];
        const minMax: number[] = args[2];
        //路径类型 曲线、矩形、直线
        const isCurve = fn.filter((e: any) => [15, 16, 17].includes(e)).length ? true : false;
        const isRectangle = fn.includes(19) && !fn.includes(14) && !isCurve ? true : false;
        const isLine = !fn.includes(19) && fn.includes(14) && !isCurve ? true : false;

        //fnArgs数组元素依次为 x，y，width，height
        //第二点坐标 const xw = x + width;  const yh = y + height;
        // const minMaxForBezier = isScalingMatrix ? minMax.slice(0) : null;
        const pathObj: any = {
            constructPathArgs: {
                ops: fn,
                args: fnArgs,
                minMax: minMax,
            },
            pageId: page.id,
            pageLabel: page.pageLabel,
            fnId: fnArray[i],
            fnArrayIndex: i,
        };
        const transform: number[][] = [];
        //后退
        for (let j = i - 1; j >= 0; j--) {
            if (fnArray[j] == 12) {
                transform.push([...argsArray[j]]);
            }
            //剪切可以有transform
            if (endMarkersBackward.includes(fnArray[j])) {
                break;
            }
        }
        //向前查看是否为 clip 剪切
        for (let j = i + 1; j < fnArray.length; j++) {
            if (fnArray[j] == 29) {
                pathObj.isClip = true;
                break;
            }
            if (endMarkersForward.includes(fnArray[j])) {
                break;
            }
        }
        pathObj.transform = transform;
        if (isCurve) {
            pathObj.type = "curve";
            if (pathDataArr.length && pathDataArr.slice(-1)[0].type != "curve") {
                tableDataArr.push([...pathDataArr]);
                pathDataArr.length = 0;
            }
            //continue;
        }
        if (isLine) {
            pathObj.type = "line";
            //如果数组中最后一个对象的类型不是线条，则将数组push到表格中，暂时认为一个表格绘制完毕
            //但表格可能绘制底纹，绘制矩形，近乎零高矩形方式绘制线段，线段
            //最后通过是否重叠，相交来处理
            if (pathDataArr.length && pathDataArr.slice(-1)[0].type != "line") {
                tableDataArr.push([...pathDataArr]);
                pathDataArr.length = 0;
            }
        }
        if (isRectangle) {
            pathObj.type = "rectangle";
           //矩形宽高
            //pathObj.width = fnArgs[2];
           // pathObj.height = fnArgs[3]; 
            if (pathDataArr.length && pathDataArr.slice(-1)[0].type != "rectangle") {
                tableDataArr.push([...pathDataArr]);
                pathDataArr.length = 0;
            }
        }
        pathDataArr.push(pathObj);
    }
} */
