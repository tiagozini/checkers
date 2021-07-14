import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { Board } from './components/Board';
import { Game } from './components/Game';
import Piece from './components/Piece';
import BoardSquare from './components/BoardSquare';
import Square from './components/Square';

test('renders learn react link', () => {
  render(<App />);
  const text1 = screen.getByText(/Next player\:/i);
  const text2 = screen.getByText(/Whites\: 12/i);
  const text3 = screen.getByText(/Blacks\: 12/i);
  const text4 = screen.getByText(/Welcome to Checkers game!/i);
  const text5 = screen.getByText(/Criado por/i);
  const text6 = screen.getByText(/Tiago Peterlevitz Zini/i);
  const text7 = screen.getByText(/2021/i);

  expect(text1).toBeInTheDocument();
  expect(text2).toBeInTheDocument();
  expect(text3).toBeInTheDocument();
  expect(text4).toBeInTheDocument();
  expect(text5).toBeInTheDocument();
  expect(text6).toBeInTheDocument();
  expect(text7).toBeInTheDocument();
});


const Button = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
)

// FIXME - not really work in the move simulation
test('simulate simple white initial move on Board', () => {

  const { container } = render(<Game />)
  let boardSquares = container.getElementsByClassName('board-square')
  const [dragPosition, dropPosition] = [17, 24];
  let dropSquare = boardSquares[dropPosition];
  let dragSquare = boardSquares[dragPosition];
  let knight = dragSquare.firstChild.firstChild;

  fireEvent.dragStart(knight);
  fireEvent.dragEnter(dropSquare);
  fireEvent.dragOver(dropSquare);
  fireEvent.drop(dropSquare);

  let boardSquaresAfterMoves = container.getElementsByClassName('board-square')
  dropSquare = boardSquaresAfterMoves[dropPosition];
  dragSquare = boardSquaresAfterMoves[dragPosition];

  //expect(dragSquare.firstChild.firstChild).toBeInstanceOf(Text);
  //expect(dropSquare.firstChild.firstChild).toBeInstanceOf(HTMLImageElement);
  expect(dragSquare.firstChild.firstChild).toHaveClass("piece");

})