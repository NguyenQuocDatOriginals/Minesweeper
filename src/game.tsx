import React, { useEffect, useRef, useState } from 'react';
import './App.scss';

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const MINE_COUNT = 50;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type Board = Cell[][];

const generateBoard = (): Board => {
  const board: Board = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

  let minesPlaced = 0;
  while (minesPlaced < MINE_COUNT) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Tính số mìn liền kề cho mỗi ô
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!board[row][col].isMine) {
        board[row][col].adjacentMines = countAdjacentMines(board, row, col);
      }
    }
  }
  return board;
};

const countAdjacentMines = (board: Board, row: number, col: number): number => {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && board[r][c].isMine) {
        count++;
      }
    }
  }
  return count;
};

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(generateBoard);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [win, setWin] = useState<boolean>(false);

  // Hàm mở (reveal) ô và các ô lân cận nếu không có mìn liền kề
  const revealCell = (row: number, col: number, newBoard: Board): Board => {
    if (newBoard[row][col].isRevealed) return newBoard;
    newBoard[row][col].isRevealed = true;
    if (!newBoard[row][col].isMine && newBoard[row][col].adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && !newBoard[r][c].isRevealed) {
            newBoard = revealCell(r, c, newBoard);
          }
        }
      }
    }
    return newBoard;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return;
    let newBoard = board.map(r => r.map(cell => ({ ...cell })));
    if (newBoard[row][col].isMine) {
      // Nếu click vào mìn thì mở tất cả các mìn và game over
      newBoard.forEach(r => r.forEach(cell => {
        if (cell.isMine) cell.isRevealed = true;
      }));
      setBoard(newBoard);
      setGameOver(true);
      setWin(false);
      return;
    }
    newBoard = revealCell(row, col, newBoard);
    setBoard(newBoard);
    // Kiểm tra chiến thắng: tất cả ô không chứa mìn đã được mở
    let won = true;
    newBoard.forEach(r =>
      r.forEach(cell => {
        if (!cell.isMine && !cell.isRevealed) won = false;
      })
    );
    if (won) {
      setGameOver(true);
      setWin(true);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    handleCellClick(row, col);
  };

  const resetGame = () => {
    setBoard(generateBoard());
    setGameOver(false);
    setWin(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = board[row][col];
        ctx.fillStyle = cell.isRevealed ? (cell.isMine ? 'red' : 'lightgray') : 'darkgray';
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        if (cell.isRevealed && !cell.isMine && cell.adjacentMines > 0) {
          ctx.fillStyle = 'black';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            cell.adjacentMines.toString(),
            col * CELL_SIZE + CELL_SIZE / 2,
            row * CELL_SIZE + CELL_SIZE / 2
          );
        }
      }
    }
  }, [board]);

  return (
    <div style={{ textAlign: 'center', position: 'relative', width: CANVAS_SIZE, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: '2px solid black' }}
        onClick={handleCanvasClick}
      />
      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          {win ? 'Bạn đã chiến thắng!' : 'Bạn đã thua cuộc!'}
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        <button onClick={resetGame}>Chơi lại</button>
      </div>
    </div>
  );
};

export default Game;