import { Game } from "../components/Game";
import { GameDefintions } from "../Constants";

export class TurnInfo {
    playerColor = null;
    f = null;
    capturedPiecePositions = null;
    currentStep = null;
    movesChosen = null;
    finished = null;
    numPossibleSteps = null;
    originalPosition = null;

    constructor(playerColor) {
        this.currentStep = 1;
        this.movesChosen = [];
        this.capturedPiecePositions = [];
        this.finished = false;
        this.playerColor = playerColor;
    }

    updatePossibleMoves(piecesPossibleMoves) {
        this.piecesPossibleMoves = piecesPossibleMoves.slice();
        this.numPossibleSteps = 1;
        for (let i = 0; i < GameDefintions.NUM_ROWS; i++) {
            if (this.piecesPossibleMoves[i])
                for (let ppm of this.piecesPossibleMoves[i]) {
                    if (ppm) {
                        this.numPossibleSteps = ppm.moves.length;
                    }
                }
        }
    }

    updateOriginalPosition(dragPiecePositioned) {
        if (this.currentStep === 1) {
            this.originalPosition = dragPiecePositioned.position;
        }
    }

    reducePiecesPossibleMoves() {
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.piecesPossibleMoves[position] != null) {
                this.piecesPossibleMoves[position] = 
                    this.piecesPossibleMoves[position].filter((ppm) =>
                    {
                        for(let i =0 ; i < this.currentStep; i++) {
                            if (ppm.moves[i] !== this.movesChosen[i]) {
                                return false;
                            }
                        }
                        return true;                        
                    }) || [];
            }
        }        
    }

    retriveLastCapturePosition() {
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.piecesPossibleMoves[position]) {
                for(let ppm of this.piecesPossibleMoves[position]) {
                    let found = true;
                    for(let i =0 ; i < this.currentStep; i++) {
                        if (ppm.moves[i] !== this.movesChosen[i]) {
                            found = false;
                        }
                    }   
                    if (found) {
                        return ppm.piecesTaken[this.currentStep - 1];
                    }
                }                     
            }
        }
        return null;
    }

    storeMove(dropPosition) {        
        this.movesChosen.push(dropPosition);
        this.finished = (this.numPossibleSteps === this.currentStep);
        this.reducePiecesPossibleMoves();
        let lastCapturedPiece = this.retriveLastCapturePosition();
        if (lastCapturedPiece) {
            this.capturedPiecePositions.push(lastCapturedPiece);
        }
        this.currentStep++;
    }
}