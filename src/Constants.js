export const ColorTypes = {
  WHITE: 'white',
  BLACK: 'black'
}

export const PlayerNames = {
  WHITE: 'White',
  BLACK: 'Black'
}

export const PieceTypes = {
  KING: 'KING',
  MAN: 'MAN'
}

export const ItemTypes = {
  PIECE: 'piece'
}

export const DiagonalTypes = {
  LEFT_UP: 'left-up',
  LEFT_DOWN: 'left-down',
  RIGHT_UP: 'right-up',
  RIGHT_DOWN: 'right-down'
}

export const ColorCss = {
  WHITE: 'white',
  GRAY: "#aaaaaa"
}

export const PossibleMoveType = {
  NO_MOVE: 0,
  LAST_MOVE: 1,
  PARTIAL_MOVE: 2
}

export const GameDefintions = {
  NUM_ROWS_BY_LINE: 8,
  NUM_ROWS: 64
}

export const GameMode = {
  AGAINST_COMPUTER: 'AGAINST_COMPUTER',
  ALONE: 'ALONE'
}

export const DraggableCapability = {
  PLAYER_CAN: 1,
  CANNOT: 0,
  COMPUTER_CAN: -1
}

export const MinMaxPoints = {
  CAPTURE_KING: 15,
  CAPUTRE_MAN: 10,
  BECAME_KING: 20,
  MOVE_MAN: 1,
  MOVE_KING: 2,
  ELIMINATE_LAST_PIECE: 1000,
  IMPOSSIBILATE_MORE_MOVES: 1000
}