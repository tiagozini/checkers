import React from 'react'
import imgPieceWhite from '../img/piece-white.png';
import imgPieceBlack from '../img/piece-black.png';
import imgDoublePieceWhite from '../img/double-piece-white.png';
import imgDoublePieceBlack from '../img/double-piece-black.png';
import { ColorTypes, PieceTypes, ItemTypes } from '../Constants';
import { useDrag } from 'react-dnd';

export default function Piece(props) {
  const type = props.type;
  const color = props.color;
  let url = null;

 
  const [{isDragging}, drag] = useDrag(() => ({
    type: ItemTypes.PIECE,
    item: { xFrom : props.xFrom, yFrom : props.yFrom, color: props.color, type: props.type},
    canDrag: props.canDrag,
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    }),
  }));

  if (PieceTypes.SIMPLE === type) {
    url = (color === ColorTypes.WHITE ? imgPieceWhite : imgPieceBlack);
  } else if (PieceTypes.DOUBLE === type) {
    url = (color === ColorTypes.WHITE ? imgDoublePieceWhite : imgDoublePieceBlack);
  }   
  return <img
    ref={drag} alt=""
    style={{
      opacity: isDragging ? 0.5 : 1,
      fontSize: 25,
      fontWeight: 'bold',
      cursor: 'move',
    }}
    src={url} width="30px"
  />
}
