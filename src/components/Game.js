import React from 'react';
import CheckersHelper from '../models/CheckersHelper';
import CheckersMinMax from '../models/CheckersMinMax';
import { Board } from './Board';
import Overlay from './Overlay';
import FileRead from './FileRead';
import ReplayBar from './ReplayButtonsBar';
import FileDownload from './FileDownload';
import { GameRecord } from '../models/GameRecord';
import { GameReplay } from '../models/GameReplay';
import {
    PieceTypes, PossibleMoveType, PlayerNames,
    GameDefintions, GameMode, DraggableCapability, ComputerLevel
} from '../Constants';
import { TurnInfo } from '../models/TurnInfo';
import { isMobile } from 'react-device-detect';
import { FaSearchPlus, FaSearchMinus, FaDesktop, FaMobileAlt, FaInfoCircle } from 'react-icons/fa';
import imgPieceManWhite from '../img/piece-man-white.png';
import imgPieceManBlack from '../img/piece-man-black.png';
import imgPieceKingWhite from '../img/piece-king-white.png';
import imgPieceKingBlack from '../img/piece-king-black.png';

export class Game extends React.Component {
    computerDragTimer = null;

    constructor(props) {
        super(props);
        let state = this.mountInitialState(GameMode.AGAINST_COMPUTER, ComputerLevel.DUMMY);
        this.state = state;
        this.turnInfo = new TurnInfo(true, state.pieces, null);
        this.handleMovePiece = this.handleMovePiece.bind(this);
        this.handleCanDropPiece = this.handleCanDropPiece.bind(this);
        this.handleCanDragPiece = this.handleCanDragPiece.bind(this);
        this.restartOrResignGame = this.restartOrResignGame.bind(this);
        this.handleGameModeChange = this.handleGameModeChange.bind(this);
        this.handleComputerLevelChange = this.handleComputerLevelChange.bind(this);
        this.doComputerPlay = this.doComputerPlay.bind(this);
        this.isLastComputerPosition = this.isLastComputerPosition.bind(this);
        this.toogleWindow = this.toogleWindow.bind(this);
        this.isLastPlayerPosition = this.isLastPlayerPosition.bind(this);
        this.handleLoadGamePlayed = this.handleLoadGamePlayed.bind(this);
        this.handleReplayBarBtClick = this.handleReplayBarBtClick.bind(this);
        this.mountDownloadFileContent = this.mountDownloadFileContent.bind(this);
    }

    restartOrResignGame() {
        if (this.state.running) {
           this.setState({...this.state, running: false, gameLoaded: false});
        } else {
            if (this.computerDragTimer) {
                clearTimeout(this.computerDragTimer);
            }
            let _gameWindowMode = this.state.gameWindowMode;
            let gameMode = document.getElementById("gameMode").value;
            let computerLevel = document.getElementById("computerLevel") ?
                document.getElementById("computerLevel").value : null;
            this.setState({...this.mountInitialState(gameMode, computerLevel),  
                running: true,
                gameLoaded: false,
                gameWindowMode: _gameWindowMode });
            this.turnInfo = new TurnInfo(true, CheckersHelper.mountInitialPieces(), null);
        }
    }

    handleGameModeChange(e) {
        let value = e.target.value;
        this.setState({
            ...this.state, gameMode: value,
            computerLevel: ComputerLevel.DUMMY
        });
    }

    isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android|ipad|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return true;
        }
        return false;
    }

    handleComputerLevelChange(e) {
        let value = e.target.value;
        this.setState({ ...this.state, computerLevel: value });
    }

    mountInitialState(gameMode, computerLevel) {
        return {
            whiteIsNext: true,
            pieces: CheckersHelper.mountInitialPieces(),
            whitesCount: 12,
            blacksCount: 12,
            count: 1,
            gameMode: gameMode,
            computerLevel: computerLevel,
            running: false,
            gameWindowMode : "game-normal-mode",
            gameLoaded : false,
            movements : []
        }
    }

    handleCanDropPiece(positionedPiece, dropPosition) {
        if (this.gameReplay) {
            return PossibleMoveType.NO_MOVE;
        }
        this.turnInfo.updateOriginalPosition(positionedPiece);
        return CheckersHelper.canDoMove(this.turnInfo, dropPosition) ?
            PossibleMoveType.LAST_MOVE : PossibleMoveType.NO_MOVE;
    }

    handleTurnEnd(pieces, whiteIsNext, gameMode, dropPosition) {
        for (let p of this.turnInfo.capturedPiecePositions) {
            console.log("capturedPiecePositions -> " + p);
            pieces[p] = null;
        }
        if (CheckersHelper.canPutTheCrown(pieces[dropPosition], dropPosition)) {
            pieces[dropPosition].type = PieceTypes.KING;
        }
        let lastComputerPosition = null;
        if (!whiteIsNext) {
            lastComputerPosition = dropPosition;
        }
        let lastPlayerPosition = null;
        if (whiteIsNext) {
            lastPlayerPosition = dropPosition;
        }        
        this.turnInfo = new TurnInfo(!whiteIsNext, pieces, lastComputerPosition, lastPlayerPosition);
    }

    handleShowInfoDesktop() {
        alert("If you are not in a desktop, you need to click on the three dots and uncheck the option \"Site for computer\" to make site behavior for mobile");
    }

    undoReplayPlay() {  
        this.gameReplay.goBefore();
        var pieces = this.state.pieces;
        var ppm = this.gameReplay.ppmsChoises[this.gameReplay.currentPlay];
        CheckersHelper.updatePieceInUndoPlay(pieces, ppm, !this.gameReplay.firstPlayerTime);
        
        const [whitesCount, blacksCount] = CheckersHelper.getTotalPiecesForColor(pieces);

        this.setState({
            ...this.state, 
            pieces: pieces,
            count: this.state.count - 1,
            blacksCount: blacksCount,
            whitesCount: whitesCount,
            whiteIsNext: this.gameReplay.isFirstPlayerTime(),
            running: true
        });
    }

    handleMovePiece = (dragPosition, dropPosition) => {
        if (!this.state.running) {
            alert("Resigned!");
            return; 
        }   

        const gameMode = this.state.gameMode;
        this.turnInfo.storeMove(dragPosition, dropPosition);
        let pieces = this.state.pieces.slice();
        let whiteIsNext = this.gameReplay ? this.gameReplay.isFirstPlayerTime() : this.state.whiteIsNext;
        pieces[dropPosition] = pieces[dragPosition];
        pieces[dragPosition] = null;
        var movements = this.state.movements;
        if (this.turnInfo.finished) {
            movements.push(CheckersHelper.getXY(this.turnInfo.originalPosition) + "-" + 
                CheckersHelper.getXY(dropPosition))
            this.handleTurnEnd(pieces, whiteIsNext, gameMode, dropPosition);
            whiteIsNext = !whiteIsNext;
        }
        const [whitesCount, blacksCount] = CheckersHelper.getTotalPiecesForColor(pieces);
        const winner = this.getTheWinner(pieces, whiteIsNext);

        this.setState({
            ...this.state, 
            pieces: pieces,
            count: this.state.count + 1,
            blacksCount: blacksCount,
            whitesCount: whitesCount,
            whiteIsNext: whiteIsNext,
            movements: movements,
            running: !winner
        });
        if (this.turnInfo.movesChosen.length > this.turnInfo.currentStep) {
            this.turnInfo.updateOriginalPosition(dragPosition);
        }
        if (winner) {
            alert("Victory of " + winner + "!");
        } else {
            if (!whiteIsNext && gameMode === GameMode.AGAINST_COMPUTER && !this.gameReplay) {
                this.doComputerPlay(this.state.computerLevel);
            } else if(this.gameReplay && !this.turnInfo.finished && this.turnInfo.currentStep > 1) {
                const ppm = this.turnInfo.computerPlayerChoice.ppm;
                this.doComputerDrag(ppm.moves[this.currentStep - 1], ppm);
            }
        }
    }

    handleCanDragPiece(positionedPiece) {    
        if (this.gameReplay) 
            return DraggableCapability.CANNOT;
        if (CheckersHelper.canDragPiece(this.turnInfo, positionedPiece)) {
            return (!this.state.whiteIsNext &&
                this.state.gameMode === GameMode.AGAINST_COMPUTER ?
                DraggableCapability.COMPUTER_CAN : DraggableCapability.PLAYER_CAN)
        }
        return DraggableCapability.CANNOT;
    }

    handleLoadGamePlayed(fileContent) {
        const savedGameJson = JSON.parse(fileContent);
        console.log("File content: " + fileContent);
        const gameMode = savedGameJson.gameMode;
        const computerLevel = savedGameJson.computerLevel;
        var gameRecord = new GameRecord(gameMode, computerLevel);
        for (let turnMoviment of savedGameJson.turnMovements) {
            gameRecord.addTurnMoviment(turnMoviment);
        }
        this.turnInfo = new TurnInfo(true, CheckersHelper.mountInitialPieces(), null);
        this.gameReplay = new GameReplay(gameRecord);
        this.setState({...this.mountInitialState(gameMode, computerLevel), gameLoaded: true, running: true, gameMode: gameMode, computerLevel: computerLevel, gameRecord: gameRecord, currentPlay: 1});
    }

    handleReplayBarBtClick(action) {
        console.log(action);
        switch(action) {
            case("forward"):
                this.gameReplay.goNext();
                let moviment = this.gameReplay.getMoviment();
                console.log(moviment);
                var originPosition = CheckersHelper.getPositionFromXY(moviment['origin']);
                var ppmChoise = this.gameReplay.getPpmChoise();
                if (ppmChoise) {
                    this.turnInfo.registerComputerPlay(ppmChoise);         
                    this.doComputerDrag(originPosition, ppmChoise, 1000);
                }
                console.log(ppmChoise);
                break;
            case("backward"):
                this.undoReplayPlay();
                return;        
            case("stop"):
                this.gameReplay = null;
                this.restartOrResignGame();
                return;                      
            default:
                return;
        }

    }

    mountTurnMovements(movements, modoOriginal) {
        var turnMovements = [];
        for (let i = 0; i < Math.ceil(movements.length / 2); i++) {
            if (modoOriginal) {
                let blackMovement = movements[(i * 2) + 1];
                turnMovements.push({
                    "id" : (i + 1),
                    "whiteMovement" : CheckersHelper.getPositionFromXY(movements[i * 2].substring(0,2)) + "-" + CheckersHelper.getPositionFromXY(movements[i * 2].substring(3,5)), 
                    "blackMovement" : (blackMovement ? CheckersHelper.getPositionFromXY(blackMovement.substring(0,2)) + "-" + CheckersHelper.getPositionFromXY(blackMovement.substring(3,5)) : null), 
                });
            } else {
                turnMovements.push({
                    "id" : (i + 1),
                    "whiteMovement" : movements[i * 2], 
                    "blackMovement" : movements[(i * 2) + 1], 
                });
            }

        }
        return turnMovements;
    }

    mountDownloadFileContent() {
        var objectContent = {
            "gameMode" : this.state.gameMode,
            "computerLevel" : this.state.computerLevel,
            "turnMovements" : this.mountTurnMovements(this.state.movements),
            "turnMovementsOriginal" : this.mountTurnMovements(this.state.movements, true)
        };
        console.log(objectContent);
        return JSON.stringify(objectContent);
    }

    getTheWinner(pieces, whiteIsNext) {
        const [whitesCount, blacksCount] = CheckersHelper.getTotalPiecesForColor(pieces);
        if (blacksCount === 0) {
            return PlayerNames.WHITE;
        }
        if (whitesCount === 0) {
            return PlayerNames.BLACK;
        }
        if (!this.turnInfo.existsPossibleMove()) {
            return whiteIsNext ? PlayerNames.BLACK : PlayerNames.WHITE;
        }
    }

    doComputerFirstMove(computerLevel) {
        let checkLevel = null;
        if (ComputerLevel.DUMMY === computerLevel) {
            return this.doComputerFirstMoveDummy();
        } else if (ComputerLevel.SMART === computerLevel) {
            checkLevel = 1;
        } else if (ComputerLevel.GENIUS === computerLevel) {
            checkLevel = 3;
        }
        let deep = checkLevel * 2;
        const [position, ppm, maxPoints] = CheckersMinMax.negamax(this.state.pieces.slice(), this.state.whiteIsNext, deep, deep);
        this.turnInfo.registerComputerPlay(ppm);
        this.doComputerDrag(position, ppm);
    }

    doComputerFirstMoveDummy() {
        let qtdTotal = 0;
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.turnInfo.piecesPossibleMoves[position]) {
                qtdTotal += this.turnInfo.piecesPossibleMoves[position].length
            }
        }
        let moveChosen = Math.trunc(Math.random(qtdTotal) * qtdTotal);
        let iPos = 0;
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.turnInfo.piecesPossibleMoves[position] != null) {
                for (let ppm of this.turnInfo.piecesPossibleMoves[position]) {
                    iPos += 1;
                    if (iPos === moveChosen + 1) {
                        this.turnInfo.registerComputerPlay(ppm);
                        this.doComputerDrag(position, ppm);
                        return;
                    }
                }
            }
        }
    }

    doComputerPlay(computerLevel) {
        if (this.turnInfo.currentStep === 1) {
            this.doComputerFirstMove(computerLevel);
        } else {
            const ppm = this.turnInfo.computerPlayerChoice.ppm;
            this.doComputerDrag(ppm.moves[this.currentStep - 1], ppm);
        }
    }

    doComputerDrag(position, ppm, delay) {
        this.computerDragTimer = setTimeout(() => {
            let dragPosition = this.turnInfo.currentStep > 1 ?
                ppm.moves[this.turnInfo.currentStep - 2] :
                position;
            this.handleMovePiece(dragPosition,
                ppm.moves[this.turnInfo.currentStep - 1]);
        }, delay ? delay : 1500);
    }

    isLastComputerPosition(position) {
        return this.turnInfo.lastComputerPosition && this.turnInfo.lastComputerPosition === position;
    }

    isLastPlayerPosition(position) {
        return this.turnInfo.lastPlayerPosition && this.turnInfo.lastPlayerPosition === position;
    }    

    toogleWindow() {
        this.setState({...this.state, gameWindowMode: this.state.gameWindowMode === 'game-normal-mode' ? "game-window-mode" : "game-normal-mode"});
    }

    userAgent2() {
        return navigator.userAgent || navigator.vendor || window.opera;        
    }

    render() {
        const winner = this.getTheWinner(this.state.pieces, this.state.whiteIsNext);
        const baseClass = "game";
        const typeClass = this.state.gameWindowMode;
        let status;

        if (winner) {
            status = <span><b><font color="red">Winner</font> <font style={{ backgroundColor: "yellow" }}></font>{winner}!</b></span>;
        } else {
            status = <span>Player <b><img src={this.state.whiteIsNext ? imgPieceManWhite : imgPieceManBlack} alt="Player turn" className='small-piece' /></b></span>;
        }
        const zoomButtonIcon = this.state.gameWindowMode === "game-window-mode" ? <FaSearchMinus/> : <FaSearchPlus/>;
        return (
            <div className={`${baseClass} ${typeClass}`}>
                <div className="game-presentation">
                    <div className='top-bar'>Checkers
                        <button onClick={this.toogleWindow} className='btn-link'  style={{maxHeight:"1em",float:"right", paddingRight:"1em"}}>
                            {zoomButtonIcon}
                        </button>                     
                    </div>
                    <div className='alternative-top-bar'>
                        <div style={{width:"25%"}}>Checkers</div>
                        <div style={{width:"25%", fontSize:"0.8em"}}>
                            {status}
                        </div>                        
                        <div style={{width:"20%", fontSize:"0.8em"}}>
                          {this.state.whitesCount}<img src={imgPieceKingWhite} className='small-piece' alt="White´s turn" />
                          {this.state.blacksCount}<img src={imgPieceKingBlack} className='small-piece' alt="Black´s turn" />                            
                        </div>
                        <div style={{width:"30%"}}>  
                            <button onClick={this.toogleWindow} className='btn-link'  style={{paddingRight:"1em"}}>{zoomButtonIcon}</button> 
                            {this.state.gameLoaded ? 
                            <div></div>:
                            <button onClick={this.restartOrResignGame}>{this.state.running ? "Resign" : "Start"}</button>}
                        </div>                    
                    </div>

                </div>
                <div className="game-board">
                    <Board
                        isLastComputerPosition={this.isLastComputerPosition}
                        isLastPlayerPosition={this.isLastPlayerPosition}
                        numRowsByLine={GameDefintions.NUM_ROWS_BY_LINE}
                        numRows={GameDefintions.NUM_ROWS}
                        handleCanDropPiece={this.handleCanDropPiece}
                        handleCanDragPiece={this.handleCanDragPiece}
                        handleMovePiece={this.handleMovePiece}
                        whiteIsNext={this.state.whiteIsNext}
                        pieces={this.state.pieces}
                        count={this.state.count}
                        running={this.state.running}
                    />
                    {!this.state.running && <Overlay color="yellow"></Overlay>}      
                </div>
                <div className="game-info clearfix">
                    <p>{status}</p>
                    <hr />
                    <p><img src={imgPieceKingWhite} className='small-piece' alt="White´s turn" />{this.state.whitesCount}<br/>
                    <img src={imgPieceKingBlack} className='small-piece' alt="Black´s turn" />{this.state.blacksCount}</p>
                    <p>Adversary<br />
                        <select name="gameMode" id="gameMode"
                            disabled={this.state.running}
							className='custom-select2'
                            value={this.state.gameMode}
                            onChange={this.handleGameModeChange}>
                            <option value={GameMode.ALONE}>Yourself</option>
                            <option value={GameMode.AGAINST_COMPUTER}>Computer</option>
                        </select>
                    </p>
                    {this.state.gameMode === GameMode.AGAINST_COMPUTER ?
                        <p >Level<br />
                            <select name="computerLevel" id="computerLevel"
                                disabled={this.state.running}
								className='custom-select2'
                                value={this.state.computerLevel}
                                onChange={this.handleComputerLevelChange}>
                                <option value={ComputerLevel.DUMMY}>Dummy</option>
                                <option value={ComputerLevel.SMART}>Smart</option>
                                <option value={ComputerLevel.GENIUS}>Genius</option>
                            </select>
                        </p>
                        : null}
                    <p>{isMobile ? <FaMobileAlt/> : (
                        <div><FaDesktop/> <button className="btn-link" onClick={this.handleShowInfoDesktop}><FaInfoCircle/></button>
                        </div>)}</p>
                    {this.state.gameLoaded ? 
                        <p><ReplayBar gameReplay={this.gameReplay} onButtonClick={this.handleReplayBarBtClick} /></p> : 
                        <p><button onClick={this.restartOrResignGame}>{this.state.running ? "Resign" : "Start"}</button><br />{!this.state.running && !winner ? <FileRead onReadFile={this.handleLoadGamePlayed}/> : <FileDownload fileName="checkers.saved.dat" contentFile={this.mountDownloadFileContent}/>}</p>}
                </div>
                <div className="game-footer clearfix">
                    <span>Created by<br /><b>Tiago Peterlevitz Zini</b></span>
                    <span><b>&copy; 2021</b></span>
                    <span><a href="https://github.com/tiagozini" target="blank">tiagozini@github.com</a></span>
                </div>
            </div>
        );
    }
}
