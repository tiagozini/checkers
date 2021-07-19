import { ColorTypes, GameDefintions } from "../Constants";
import CheckersHelper from "./CheckersHelper";

export class TurnInfo {
    playerColor = null;
    f = null;
    capturedPiecePositions = null;
    currentStep = null;
    movesChosen = null;
    finished = null;
    numPossibleSteps = null;
    originalPosition = null;
    piecesPossibleMoves = [];
    lastComputerPosition = null;

    constructor(whiteIsNext, pieces, lastComputerPosition) {
        this.currentStep = 1;
        this.movesChosen = [];
        this.capturedPiecePositions = [];
        this.finished = false;
        this.playerColor = whiteIsNext ? ColorTypes.WHITE : ColorTypes.BLACK;
        this.piecesPossibleMoves = CheckersHelper.getPossibleMoves(pieces.slice(), whiteIsNext);
        this.numPossibleSteps = this.getNumPossibleMoves(this.piecesPossibleMoves);
        this.lastComputerPosition = lastComputerPosition;
    }

    getNumPossibleMoves(piecesPossibleMoves) {
        for (let i = 0; i < GameDefintions.NUM_ROWS; i++) {
            if (piecesPossibleMoves[i])
                for (let ppm of piecesPossibleMoves[i]) {
                    if (ppm) {
                        return ppm.moves.length;
                    }
                }
        }
        return 1;
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
                    this.piecesPossibleMoves[position].filter((ppm) => {
                        for (let i = 0; i < this.currentStep; i++) {
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
                for (let ppm of this.piecesPossibleMoves[position]) {
                    let found = true;
                    for (let i = 0; i < this.currentStep; i++) {
                        if (ppm.moves[i] !== this.movesChosen[i]) {
                            found = false;
                        }
                    }
                    if (found) {
                        return ppm.piecesCaptured[this.currentStep - 1];
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
        if (!this.finished) {
            this.currentStep++;
        }
    }

    existsPossibleMove() {
        if (this.piecesPossibleMoves) {
            return this.piecesPossibleMoves.filter(
                (ppms) => ppms && ppms.length > 0).length > 0;
        }
        return false;
    }

}