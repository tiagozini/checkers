import React from 'react';
import CheckersHelper from '../models/CheckersHelper';
import CheckersMinMax from '../models/CheckersMinMax';
import { Board } from './Board';

import {
    PieceTypes, PossibleMoveType, PlayerNames,
    GameDefintions, GameMode, DraggableCapability, ComputerLevel
} from '../Constants';
import { TurnInfo } from '../models/TurnInfo';

export class Game extends React.Component {
    computerDragTimer = null;

    constructor(props) {
        super(props);
        let state = this.mountInitialState(GameMode.AGAINST_COMPUTER,
            ComputerLevel.DUMMY);
        this.state = state;
        this.turnInfo = new TurnInfo(true, state.pieces, null);
        this.handleMovePiece = this.handleMovePiece.bind(this);
        this.handleCanDropPiece = this.handleCanDropPiece.bind(this);
        this.handleCanDragPiece = this.handleCanDragPiece.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.handleGameModeChange = this.handleGameModeChange.bind(this);
        this.handleComputerLevelChange = this.handleComputerLevelChange.bind(this);
        this.doComputerPlay = this.doComputerPlay.bind(this);
        this.isLastComputerPosition = this.isLastComputerPosition.bind(this);
    }

    restartGame() {
        if (this.computerDragTimer) {
            clearTimeout(this.computerDragTimer);
        }
        let gameMode = document.getElementById("gameMode").value;
        let computerLevel = document.getElementById("computerLevel") ?
            document.getElementById("computerLevel").value : null;
        this.setState(this.mountInitialState(gameMode, computerLevel));
        this.turnInfo = new TurnInfo(true, CheckersHelper.mountInitialPieces(), null);
    }

    handleGameModeChange(e) {
        let value = e.target.value;
        this.setState({
            ...this.state, gameMode: value,
            computerLevel: ComputerLevel.DUMMY
        });
        this.restartGame();
    }

    handleComputerLevelChange(e) {
        let value = e.target.value;
        this.setState({ ...this.state, computerLevel: value });
        this.restartGame();
    }

    mountInitialState(gameMode, computerLevel) {
        return {
            whiteIsNext: true,
            pieces: CheckersHelper.mountInitialPieces(),
            whitesCount: 12,
            blacksCount: 12,
            count: 1,
            gameMode: gameMode,
            computerLevel: computerLevel
        }
    }

    handleCanDropPiece(positionedPiece, dropPosition) {
        this.turnInfo.updateOriginalPosition(positionedPiece);
        return CheckersHelper.canDoMove(this.turnInfo, dropPosition) ?
            PossibleMoveType.LAST_MOVE : PossibleMoveType.NO_MOVE;
    }

    handleTurnEnd(pieces, whiteIsNext, gameMode, dropPosition) {
        for (let p of this.turnInfo.capturedPiecePositions) {
            pieces[p] = null;
        }
        if (CheckersHelper.canPutTheCrown(pieces[dropPosition], dropPosition)) {
            pieces[dropPosition].type = PieceTypes.KING;
        }
        let lastComputerPosition = null;
        if (!whiteIsNext && gameMode === GameMode.AGAINST_COMPUTER) {
            lastComputerPosition = dropPosition;
        }
        this.turnInfo = new TurnInfo(!whiteIsNext, pieces, lastComputerPosition);
    }

    handleMovePiece = (dragPosition, dropPosition) => {
        const gameMode = this.state.gameMode;
        this.turnInfo.storeMove(dropPosition);
        let pieces = this.state.pieces.slice();
        let whiteIsNext = this.state.whiteIsNext;
        pieces[dropPosition] = pieces[dragPosition];
        pieces[dragPosition] = null;
        if (this.turnInfo.finished) {
            this.handleTurnEnd(pieces, whiteIsNext, gameMode, dropPosition);
            whiteIsNext = !whiteIsNext;
        }
        const [whitesCount, blacksCount] = CheckersHelper.getTotalPiecesForColor(pieces);
        this.setState({
            ...this.state, pieces: pieces,
            count: this.state.count + 1,
            blacksCount: blacksCount,
            whitesCount: whitesCount,
            whiteIsNext: whiteIsNext
        });
        if (this.turnInfo.movesChosen.length > this.turnInfo.currentStep) {
            this.turnInfo.updateOriginalPosition(dragPosition);
        }
        if (!whiteIsNext && gameMode === GameMode.AGAINST_COMPUTER) {
            this.doComputerPlay(this.state.computerLevel);
        }
    }

    handleCanDragPiece(positionedPiece) {
        if (CheckersHelper.canDragPiece(this.turnInfo, positionedPiece)) {
            return (!this.state.whiteIsNext &&
                this.state.gameMode === GameMode.AGAINST_COMPUTER ?
                DraggableCapability.COMPUTER_CAN : DraggableCapability.PLAYER_CAN)
        }
        return DraggableCapability.CANNOT;
    }

    getTheWinner(pieces, whiteIsNext) {
        const [whitesCount, blacksCount] =
            CheckersHelper.getTotalPiecesForColor(pieces);
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
        const [position, ppm] = CheckersMinMax.negamax(
            this.state.pieces.slice(), this.state.whiteIsNext,
            deep, deep);
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

    doComputerDrag(position, ppm) {
        this.computerDragTimer = setTimeout(() => {
            let dragPosition = this.turnInfo.currentStep > 1 ?
                ppm.moves[this.turnInfo.currentStep - 2] :
                position;
            this.handleMovePiece(dragPosition,
                ppm.moves[this.turnInfo.currentStep - 1]);
        }, 1500);
    }

    isLastComputerPosition(position) {
        return this.turnInfo.lastComputerPosition && this.turnInfo.lastComputerPosition === position;
    }

    render() {
        const winner = this.getTheWinner(this.state.pieces, this.state.whiteIsNext);
        let status;

        if (winner) {
            status = <span>Winner: <b>{winner}</b></span>;
        } else {
            status = <span>Next player: <b>{this.state.whiteIsNext ? 'White' : 'Black'}</b></span>;
        }
        return (
            <div className="game">
                <div className="game-presentation">
                    <p>Welcome to Checkers game!</p>
                </div>
                <div className="game-board">
                    <Board
                        isLastComputerPosition={this.isLastComputerPosition}
                        numRowsByLine={GameDefintions.NUM_ROWS_BY_LINE}
                        numRows={GameDefintions.NUM_ROWS}
                        handleCanDropPiece={this.handleCanDropPiece}
                        handleCanDragPiece={this.handleCanDragPiece}
                        handleMovePiece={this.handleMovePiece}
                        whiteIsNext={this.state.whiteIsNext}
                        pieces={this.state.pieces}
                        count={this.state.count}
                    />
                </div>
                <div className="game-info clearfix">
                    <p>{status}</p>
                    <p>Whites: {this.state.whitesCount}</p>
                    <p>Blacks: {this.state.blacksCount}</p>
                    <p><button onClick={this.restartGame}>Restart</button></p>
                    <p>Adversary:<br />
                        <select name="gameMode" id="gameMode"
                            value={this.state.gameMode}
                            onChange={this.handleGameModeChange}>
                            <option value={GameMode.ALONE}>Yourself</option>
                            <option value={GameMode.AGAINST_COMPUTER}>Computer</option>
                        </select>
                    </p>
                    {this.state.gameMode === GameMode.AGAINST_COMPUTER ?
                        <p>Level:<br />
                            <select name="computerLevel" id="computerLevel"
                                value={this.state.computerLevel}
                                onChange={this.handleComputerLevelChange}>
                                <option value={ComputerLevel.DUMMY}>Dummy</option>
                                <option value={ComputerLevel.SMART}>Smart</option>
                                <option value={ComputerLevel.GENIUS}>Genius</option>
                            </select>
                        </p>
                        : null}
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
