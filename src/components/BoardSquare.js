import React from 'react';
import { useDrop } from 'react-dnd';
import { Square } from './Square';
import Overlay from './Overlay';
import { ItemTypes, PossibleMoveType } from '../Constants';

export default function BoardSquare(props) {

  function getStyle() {
    return {
      position: 'relative',
      width: '100%',
      height: '100%',
      display:'table-cell'};
  }

  function movePiece(originalPosition, targetPosition) {
    props.handleMovePiece(originalPosition, targetPosition);
  }

  /***
   * Return 3 possibles returns:
   * false when cant move to that place
   * true when is possible to move
   * undefined when is possible, but not as final position, just as part of trajetory
   */
  function canMovePiece(positionedPiece, targetPosition) {
    if (props.piece == null && positionedPiece !=null) {
      const codCanMove = props.handleCanMovePiece(positionedPiece, targetPosition);
      if (codCanMove === PossibleMoveType.PARTIAL_MOVE) {
        return undefined;
      }
      return codCanMove === PossibleMoveType.LAST_MOVE;
    }
    return false;      
  }

  const [{ isOver, canDrop  }, drop] = useDrop(() => ({
    accept: ItemTypes.PIECE,
    drop: (positionedPiece, monitor) => movePiece(positionedPiece.position, props.position),
    canDrop: (positionedPiece, monitor) => canMovePiece(positionedPiece, props.position),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop()
    }),
  }), [props.position])

  return (<div ref={drop}
    style={getStyle()}><Square position={props.position} 
        piece={props.piece}>{props.children}</Square>
      {isOver && canDrop === false && <Overlay color="red" />}
      {!isOver && canDrop && <Overlay color="yellow" />}
      {isOver && canDrop && <Overlay color="green" />}
      {!isOver && canDrop === undefined && <Overlay color="orange" />}
      {isOver && canDrop === undefined && <Overlay color="red" />}
    </div>);
}