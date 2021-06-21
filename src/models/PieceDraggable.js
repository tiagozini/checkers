export class PieceDraggable {
    color = null;
    type = null;
    xFrom = null;
    yFrom = null;

    constructor(color, type, xFrom, yFrom) {
        this.color = color;
        this.type = type;
        this.xFrom = xFrom;
        this.yFrom = yFrom;
    }
}