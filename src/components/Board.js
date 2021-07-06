import React from 'react';
import BoardSquare from './BoardSquare';
import Piece from './Piece';
import { PositionedPiece } from '../models/PositionedPiece';

import { TouchBackend } from 'react-dnd-touch-backend'
import { DndProvider } from 'react-dnd'

export class Board extends React.Component {
    constructor(props) {
        super(props);
        this.possibleMoves = [];
        for(let i = 0; i < props.numRows; i++) {
            this.possibleMoves.push(null);
        }
        this.movePiece = props.handleMovePiece.bind(this);
        this.handleCanMovePiece = props.handleCanMovePiece.bind(this);
        this.handleCanDragPiece = props.handleCanDragPiece.bind(this);
    }    

    renderSquare(position) {
      const piece = this.props.pieces[position];
      return (
        <div key={""+position+"-"+this.props.count+"-" +this.props.whiteIsNext}             
            className="game-board-square" >
            <BoardSquare 
                position={position} 
                handleMovePiece={this.movePiece}
                handleCanMovePiece={this.handleCanMovePiece}
                whiteIsNext={this.props.whiteIsNext}
                count={this.props.count}
                piece={piece} >
                {piece != null && <Piece color={piece.color} 
                    type={piece.type} 
                    position={position}
                    canDrag={this.handleCanDragPiece(new PositionedPiece(piece.color, piece.type,
                        position))}
                    />}
            </BoardSquare>
        </div>
      );
    }

    render() {
        const backendOptions = {
            enableMouseEvents: true
        }   
        return (
            <DndProvider backend={TouchBackend} options={backendOptions}>
                    {Array.from(Array(this.props.numRowsByLine).keys()).map((lineNumber)=> 
                        Array.from(Array(this.props.numRowsByLine).keys()).map((rowNumber) => 
                            this.renderSquare((lineNumber) * this.props.numRowsByLine + rowNumber)
                        )
                    )}
            </DndProvider>          
        );
    }
}
