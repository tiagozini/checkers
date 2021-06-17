import React from 'react';
import { Square } from './Square';
import Overlay from './Overlay';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../Constants';

export default function BoardSquare(props) {

  const x = props.position % 8;
  const y = Math.trunc(props.position / 8);
  
  function movePiece(xFrom, yFrom, xTo, yTo) {
    props.handleMovePiece(xFrom, yFrom, xTo, yTo);
  }

  /***
   * Return 3 possibles returns:
   * false when cant move to that place
   * true when is possible to move
   * undefined when is possible, but not as final position, just as part of trajetory
   */
  function canMovePiece(item, xTo, yTo) {
    if (props.piece == null && item !=null) {
      const codCanMove = props.handleCanMovePiece(item, xTo, yTo);
      if (codCanMove == 2) {
        return undefined;
      }
      return codCanMove == 1;
    }
    return false;      
  }

  const [{ isOver, canDrop  }, drop] = useDrop(() => ({
    accept: ItemTypes.PIECE,
    drop: (item, monitor) => movePiece(item.xFrom, item.yFrom, x, y),
    canDrop: (item, monitor) => canMovePiece(item, x, y),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop()
    }),
  }), [x, y])

  return (<div ref={drop}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display:'table-cell'}}><Square position={props.position} 
        piece={props.piece}>{props.children}</Square>
      {isOver && canDrop === false && <Overlay color="red" />}
      {!isOver && canDrop && <Overlay color="yellow" />}
      {isOver && canDrop && <Overlay color="green" />}
      {!isOver && canDrop == undefined && <Overlay color="orange" />}
      {isOver && canDrop == undefined && <Overlay color="red" />}
    </div>);
}