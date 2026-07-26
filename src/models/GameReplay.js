import { TurnInfo } from "./TurnInfo";
import CheckersHelper from "./CheckersHelper";

export class GameReplay {
    turnId = null;
    totalTurns = null;
    gameRecord = null;
    firstPlayerTime = null;
    currentPlay = null;
    turnInfos = null;

    constructor(gameRecord) { 
        this.gameRecord = gameRecord;
        this.totalTurns = gameRecord.turnMovements.length;
        this.totalPlays = (this.totalTurns - 1)  * 2 + (gameRecord.turnMovements[this.totalTurns-1]['blackMovement']?2:1);
        this.currentPlay = 0;
        this.turnId = 0;
        this.firstPlayerTime = false;
        this.turnInfos = this.calculateTurnInfos(gameRecord);
    } 

    calculateTurnInfos(gameRecord) {
        var pieces = CheckersHelper.mountInitialPieces();
        var turnInfo = null;
        var ppmChoise = null;
        var movement = null;
        var originPosition = null;
        var targetPosition = null;
        var turnInfos = [];
        var piecesCapturedTypeByTurn = [];

        for (let i=0; i< gameRecord.turnMovements.length; i++ ) {
            for (let pl=0; pl< 2; pl++ ) {
                movement = this.getMovimentBy(i, pl);
                if (movement) {
                    console.log("movement= " + movement);
                    originPosition = CheckersHelper.getPositionFromXY(movement['origin']);
                    targetPosition = CheckersHelper.getPositionFromXY(movement['target']);        
                    turnInfo = new TurnInfo(pl === 0, pieces, null);
                    ppmChoise = null;
                    if (turnInfo.piecesPossibleMoves[originPosition]) {
                        for(let ppm of turnInfo.piecesPossibleMoves[originPosition]) {
                            if (ppm.getLastMovePosition() === targetPosition) {
                                ppmChoise = ppm;
                                piecesCapturedTypeByTurn.push(CheckersHelper.getPiecesCapturedType(ppm, pieces));
                                CheckersHelper.updatePiecesInTheTurnEnd(pieces, ppmChoise);
                                break;
                            }                
                        }
                    }
                    turnInfos.push(new TurnInfo(pl === 0, pieces, ppmChoise));
                }
            }

        }
        console.log(turnInfos)
        return turnInfos;
    }

    getMoviment(id) {
        let playerLabel = this.firstPlayerTime ? 'whiteMovement' : 'blackMovement';
        let movement = this.gameRecord.turnMovements[this.turnId-1][playerLabel].split("-");
        return {'origin' : movement[0], 'target': movement[1] };
    }

    getMovimentBy(movementId, pl) {
        let playerLabel = pl === 0 ? 'whiteMovement' : 'blackMovement';
        let playerMoviment = this.gameRecord.turnMovements[movementId][playerLabel];
        if (playerMoviment) {
            let movementParts = this.gameRecord.turnMovements[movementId][playerLabel].split("-");
            return {'origin' : movementParts[0], 'target': movementParts[1] };
        }
        return null;
    }

    getTurnInfo() {
        console.log("currentPlay: "  + this.currentPlay);
        if (this.currentPlay === 0)
            return null;
        return this.turnInfos[this.currentPlay - 1];
    }

    getLastTurnInfo() {
        console.log("currentPlay: "  + this.currentPlay);
        if (this.currentPlay <= 1)
            return null;
        return this.turnInfos[this.currentPlay - 2];
    }

    goNext() {
        if (this.hasNext()) {
            this.currentPlay++;
            this.turnId = Math.ceil(this.currentPlay/2);
            this.firstPlayerTime = this.currentPlay % 2 === 1;
            // FIXME externarlizar esse controle
            if (this.currentPlay > 0)
                this.turnInfos[this.currentPlay - 1].currentStep = 1;            
        }
    }

    goBefore() {
        if (this.hasBefore()) {
            this.currentPlay--;
            this.turnId = Math.ceil(this.currentPlay/2);
            this.firstPlayerTime = this.currentPlay % 2 === 1;
            // FIXME externarlizar esse controle
            if (this.currentPlay > 0)
                this.turnInfos[this.currentPlay - 1].currentStep = 1; // reseta o contadordos passos
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