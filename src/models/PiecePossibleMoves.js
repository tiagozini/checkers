import CheckersHelper from "./CheckersHelper";

export class PiecePossibleMoves {
    moves = [];
    piecesCaptured = [];
    originalPosition = null;
    piecesCapturedTypes = [];
    originalType = null;

    constructor(originalPosition, moves, piecesCaptured, piecesCapturedTypes, originalType) {
        this.originalPosition = originalPosition;
        this.moves = moves;
        this.piecesCaptured = piecesCaptured;
        this.piecesCapturedTypes = piecesCapturedTypes;
        this.originalType = originalType;
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

    getPiecesCapturedPosition() {
        return this.piecesCaptured;
    }

    getOriginalPosition() {
        return this.originalPosition;
    }    
}