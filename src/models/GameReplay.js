import { TurnInfo } from "./TurnInfo";
import CheckersHelper from "./CheckersHelper";

export class GameReplay {
    turnId = null;
    totalTurns = null;
    gameRecord = null;
    firstPlayerTime = null;
    currentPlay = null;

    constructor(gameRecord) { 
        this.gameRecord = gameRecord;
        this.totalTurns = gameRecord.turnMovements.length;
        this.totalPlays = (this.totalTurns - 1)  * 2 + (gameRecord.turnMovements[this.totalTurns-1]['blackMovement']?2:1);
        this.currentPlay = 0;
        this.turnId = 0;
        this.firstPlayerTime = false;
        this.ppmsChoises = this.calculatePpmsChoises(gameRecord);
    } 

    calculatePpmsChoises(gameRecord) {
        var pieces = CheckersHelper.mountInitialPieces();
        var turnInfo = null;
        var ppmChoise = null;
        var moviment = null;
        var originPosition = null;
        var targetPosition = null;
        var ppmChoises = [];
        var piecesCapturedTypeByTurn = [];

        for (let i=0; i< gameRecord.turnMovements.length; i++ ) {
            for (let pl=0; pl< 2; pl++ ) {
                moviment = this.getMovimentBy(i, pl);
                if (moviment) {
                    console.log("moviment= " + moviment);
                    originPosition = CheckersHelper.getPositionFromXY(moviment['origin']);
                    targetPosition = CheckersHelper.getPositionFromXY(moviment['target']);        
                    turnInfo = new TurnInfo(pl === 0, pieces, null);
                    ppmChoise = null;
                    if (turnInfo.piecesPossibleMoves[originPosition]) {
                        for(let ppm of turnInfo.piecesPossibleMoves[originPosition]) {
                            if (ppm.getLastMovePosition() === targetPosition) {
                                ppmChoise = ppm;
                                piecesCapturedTypeByTurn.push(CheckersHelper.getPiecesCapturedType(ppm, pieces));
                                CheckersHelper.updatePiecesInTheTurnEnd(pieces, originPosition, ppmChoise);
                                break;
                            }                
                        }
                    }
                    ppmChoises.push(ppmChoise);
                }
            }

        }
        console.log(ppmChoises)
        return ppmChoises;
    }

    getMoviment(id) {
        let playerLabel = this.firstPlayerTime ? 'whiteMovement' : 'blackMovement';
        let moviment = this.gameRecord.turnMovements[this.turnId-1][playerLabel].split("-");
        return {'origin' : moviment[0], 'target': moviment[1] };
    }

    getMovimentBy(movimentId, pl) {
        let playerLabel = pl === 0 ? 'whiteMovement' : 'blackMovement';
        let playerMoviment = this.gameRecord.turnMovements[movimentId][playerLabel];
        if (playerMoviment) {
            let movimentParts = this.gameRecord.turnMovements[movimentId][playerLabel].split("-");
            return {'origin' : movimentParts[0], 'target': movimentParts[1] };
        }
        return null;
    }

    getPpmChoise() {
        console.log("currentPlay: "  + this.currentPlay);
        if (this.currentPlay === 0)
            return 0;
        return this.ppmsChoises[this.currentPlay - 1];
    }

    goNext() {
        if (this.hasNext()) {
            this.currentPlay++;
            this.turnId = Math.ceil(this.currentPlay/2);
            this.firstPlayerTime = this.currentPlay % 2 === 1;
        }
    }

    goBefore() {
        if (this.hasBefore()) {
            this.currentPlay--;
            this.turnId = Math.ceil(this.currentPlay/2);
            this.firstPlayerTime = this.currentPlay % 2 === 1
        }
    }
    
    stop() {
        if (this.hasBefore()) {
            this.currentPlay--;
            this.turnId = Math.ceil(this.currentPlay/2);
            this.firstPlayerTime = this.currentPlay % 2 === 1
        }
    }    

    hasNext() {
        return this.currentPlay <= this.totalPlays;
    }

    hasBefore() {
        return this.currentPlay > 0;
    }

    isFirstPlayerTime() { return this.firstPlayerTime; }
}