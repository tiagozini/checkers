export class PiecePossibleMoves {
    moves = [];
    piecesCaptured = [];

    constructor(moves, piecesCaptured) {
        this.moves = moves;
        this.piecesCaptured = piecesCaptured;
    }
}