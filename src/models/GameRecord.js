export class GameRecord {
    turnMovements = [];
    gameMode = null;
    computerLevel = null;
    priorizerStrategy = null;

    constructor(gameMode, computerLevel, priorizerStrategy) { 
        this.gameMode = gameMode;
        this.computerLevel = computerLevel;
        this.priorizerStrategy = priorizerStrategy;
    }

    addTurnMoviment(turnMoviment) {
        this.turnMovements.push(turnMoviment);
    }    
}