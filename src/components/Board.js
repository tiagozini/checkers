import React from 'react';
import BoardSquare from './BoardSquare';
import Piece from './Piece';
import { PositionedPiece } from '../models/PositionedPiece';
import Overlay from './Overlay';

import { TouchBackend } from 'react-dnd-touch-backend'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { isDesktop } from 'react-device-detect';
import { DndProvider } from 'react-dnd'
import { GameDefintions } from '../Constants';


export class Board extends React.Component {
    constructor(props) {
        super(props);
        this.possibleMoves = [];
        for (let i = 0; i < props.numRows; i++) {
            this.possibleMoves.push(null);
        }
        this.handleMovePiece = props.handleMovePiece.bind(this);
        this.handleCanDropPiece = props.handleCanDropPiece.bind(this);
        this.handleCanDragPiece = props.handleCanDragPiece.bind(this);
        this.isLastComputerPosition = props.isLastComputerPosition.bind(this);
    }

    renderSquare(position) {
        const piece = this.props.pieces[position];
        const didComputerLastMove = this.isLastComputerPosition(position);
        return (
            <div key={"" + position + "-" + this.props.count + "-" + this.props.whiteIsNext}
                className="game-board-square" id={"game-board-square-" + position} >
                <BoardSquare
                    position={position}
                    handleMovePiece={this.handleMovePiece}
                    handleCanDropPiece={this.handleCanDropPiece}
                    whiteIsNext={this.props.whiteIsNext}
                    count={this.props.count}
                    piece={piece} >
                    {piece != null && <Piece color={piece.color}
                        didComputerLastMove={didComputerLastMove}
                        type={piece.type}
                        position={position}
                        canDrag={this.handleCanDragPiece(new PositionedPiece(piece.color, piece.type,
                            position))}
                    />}
                </BoardSquare>
            </ div>
        );
    }

    render() {
        const backendOptions = {
            enableMouseEvents: true
        }
        const backend=isDesktop ? HTML5Backend : TouchBackend;
        return (
            <DndProvider backend={backend} options={backendOptions}>
                {Array.from(Array(this.props.numRowsByLine).keys()).map((lineNumber) =>
                    Array.from(Array(this.props.numRowsByLine).keys()).map((rowNumber) =>
                        this.renderSquare(GameDefintions.NUM_ROWS - 1 - ((lineNumber) * this.props.numRowsByLine + rowNumber))
                    )
                )}
            </DndProvider>
        );
    }
}
