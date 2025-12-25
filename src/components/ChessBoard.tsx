import React from 'react';
import styles from './ChessBoard.module.css';
import { BoardState, Player, Coordinates, PieceType } from '@/lib/chess/types';

interface ChessBoardProps {
    board: BoardState;
    onCellClick: (x: number, y: number) => void;
    selectedPos: Coordinates | null;
    validMoves: Coordinates[];
    turn: Player;
    isMyTurn: boolean;
    winner: Player | 'draw' | null;
    myRole: Player | null;
}

const PIECE_ICONS: Record<PieceType, string> = {
    // White pieces (using filled symbols)
    // Black pieces (using filled symbols, colored by CSS)
    // Actually, Unicode has separate codes for white and black pieces.
    // But using same codes and coloring with CSS is easier for consistency.
    // Let's use the standard filled symbols.
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
};

const ChessBoard: React.FC<ChessBoardProps> = ({
    board,
    onCellClick,
    selectedPos,
    validMoves,
    turn,
    isMyTurn,
    winner,
    myRole
}) => {
    const renderCell = (x: number, y: number) => {
        const isBlackCell = (x + y) % 2 === 1;
        const piece = board[y][x];
        const isSelected = selectedPos?.x === x && selectedPos?.y === y;
        const isValid = validMoves.some(m => m.x === x && m.y === y);

        // 自分の視点に合わせて盤面を回転させる？
        // 今回は固定（白が下）とする。

        return (
            <div
                key={`${x}-${y}`}
                className={`
          ${styles.cell} 
          ${isBlackCell ? styles.blackCell : styles.whiteCell}
          ${isSelected ? styles.selected : ''}
          ${isValid ? styles.validMove : ''}
        `}
                onClick={() => onCellClick(x, y)}
            >
                {piece && (
                    <div
                        className={styles.pieceWrapper}
                        style={{
                            transform: myRole === 'black' ? 'rotate(180deg)' : 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        <span className={`${styles.piece} ${piece.player === 'white' ? styles.whitePiece : styles.blackPiece}`}>
                            {PIECE_ICONS[piece.type]}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    // 盤面生成
    // 白(下)視点なら y: 0..7 (上から下)
    // 黒(上)視点なら y: 7..0 (下から上)
    // 今回は固定で。

    const rows = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            rows.push(renderCell(x, y));
        }
    }

    return (
        <div
            className={styles.board}
            style={{
                transform: myRole === 'black' ? 'rotate(180deg)' : 'none'
            }}
        >
            {rows}
        </div>
    );
};

export default ChessBoard;
