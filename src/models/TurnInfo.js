import { ColorTypes, GameDefintions } from "../Constants";
import CheckersHelper from "./CheckersHelper";

export class TurnInfo {
    playerColor = null;
    f = null;
    currentStep = null;
    movesChosen = null;
    finished = null;
    numPossibleSteps = null;
    originalPosition = null;
    piecesPossibleMoves = [];
    playerChoice = null;

    constructor(whiteIsNext, pieces, playerChoice) {
        this.currentStep = 1;
        this.movesChosen = playerChoice ? playerChoice.moves : [];
        this.playerChoice = playerChoice;
        this.finished = !!playerChoice;
        this.playerColor = whiteIsNext ? ColorTypes.WHITE : ColorTypes.BLACK;
        this.piecesPossibleMoves = CheckersHelper.getPossibleMoves(pieces.slice(), whiteIsNext);
        this.numPossibleSteps = this.getNumPossibleMoves(this.piecesPossibleMoves);
        this.originalPosition = null;
    }

    lastComputerPosition() {
        if (this.playerColor === ColorTypes.WHITE)
            return null;
        return this.playerChoice && this.playerChoice.getLastMovePosition();
    }

    lastPlayerPosition() {
        if (this.playerColor === ColorTypes.BLACK)
            return null;        
        return this.playerChoice && this.playerChoice.getLastMovePosition();
    }

    registerComputerPlay(piecePossibleMoves) {
        this.playerChoice = piecePossibleMoves;
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
            //console.log("this.originalPosition:" + this.originalPosition);
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
        if (this.piecesPossibleMoves[this.originalPosition]) {
            for (let ppm of this.piecesPossibleMoves[this.originalPosition]) {
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
        return null;
    }

    getPpmChoiceByMovesChosen() {
        if (this.piecesPossibleMoves[this.originalPosition]) {
            for (let ppm of this.piecesPossibleMoves[this.originalPosition]) {
                let found = true;
                if (ppm.moves.length !== this.currentStep)
                    continue;
                for (let i = 0; i < this.currentStep; i++) {
                    if (ppm.moves[i] !== this.movesChosen[i]) {
                        found = false;
                    }
                }
                if (found) {
                    return ppm;
                }
            }
        }
        return null;
    }    

    storeMove(dragPosition, dropPosition) {
        this.movesChosen.push(dropPosition);
        if (this.movesChosen.length === 1) {
            this.originalPosition = dragPosition;
        }
        this.finished = (this.numPossibleSteps === this.currentStep);
        this.reducePiecesPossibleMoves();
        if (!this.finished) {
            this.currentStep++;
        } else {
            this.playerChoice = this.getPpmChoiceByMovesChosen();
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