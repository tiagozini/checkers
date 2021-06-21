export class PiecePossibleMoves {
    moves = [];
    piecesTaken  = []; 

    constructor(moves, piecesTaken) {
        this.moves = moves;
        this.piecesTaken = piecesTaken;
    }
}