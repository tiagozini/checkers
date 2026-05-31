import CheckersMinMax from "./CheckersMinMax";

test('adds 1 + 2 to equal 3', () => {
  let pieces = {}
  let piecePossibleMoves = []
  let originalPosition = "01"
  expect(CheckersMinMax.getTurnMovementsPoints(pieces, originalPosition, piecePossibleMoves)).toBe(100);
});