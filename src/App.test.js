import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const text1 = screen.getByText(/Next player\: White/i);
  const text2 = screen.getByText(/Whites\: 12/i);
  const text3 = screen.getByText(/Blacks\: 12/i);
  expect(text1).toBeInTheDocument();
  expect(text2).toBeInTheDocument();
  expect(text3).toBeInTheDocument();
});
