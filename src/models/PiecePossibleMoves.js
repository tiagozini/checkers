import CheckersHelper from "./CheckersHelper";

export class PiecePossibleMoves {
    moves = [];
    piecesCaptured = [];


    constructor(originalPosition, moves, piecesCaptured) {
        this.originalPosition = originalPosition;
        this.moves = moves;
        this.piecesCaptured = piecesCaptured;
    }

    formatMovement() {
        if (this.moves) {
            return "["+CheckersHelper.getXY(this.originalPosition) + "->" + CheckersHelper.getXY(this.moves[this.moves.length-1]) + "]";
        }
        return "";
    }

    getLastMovePosition() {
        return this.moves ? this.moves[this.moves.length-1] : null;
    }
}