export class GameRecord {
    turnMovements = [];
    gameMode = null;
    computerLevel = null;

    constructor(gameMode, computerLevel) { 
        this.gameMode = gameMode;
        this.computerLevel = computerLevel;
    }

    addTurnMoviment(turnMoviment) {
        this.turnMovements.push(turnMoviment);
    }    
}