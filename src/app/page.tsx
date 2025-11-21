'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Board } from '@/components/Board';
import { Komadai } from '@/components/Komadai';
import { createInitialState, executeMove, executeDrop, canPromote } from '@/lib/shogi/engine';
import { getValidMoves } from '@/lib/shogi/rules';
import { GameState, Coordinates, Piece } from '@/lib/shogi/types';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [validMoves, setValidMoves] = useState<Coordinates[]>([]);
  const [selectedHandPiece, setSelectedHandPiece] = useState<Piece | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState<{ from: Coordinates, to: Coordinates } | null>(null);

  useEffect(() => {
    setGameState(createInitialState());
  }, []);

  if (!gameState) return <div>Loading...</div>;

  const handleCellClick = (x: number, y: number) => {
    if (showPromotionDialog) return;

    const clickedCell = gameState.board[y][x];
    const isOwnPiece = clickedCell?.owner === gameState.turn;

    // 1. Handle Drop
    if (selectedHandPiece) {
      if (!clickedCell) {
        // Basic drop validation (e.g., Pawn drop mate, Two Pawns check needed later)
        // For now, just allow drop on empty cell
        // TODO: Add Two Pawns (Nifu) check
        setGameState(executeDrop(gameState, selectedHandPiece.id, { x, y }));
        setSelectedHandPiece(null);
        setValidMoves([]);
      } else {
        // Cancel drop if clicked on occupied cell (unless it's own piece, then select it)
        if (isOwnPiece) {
          selectPieceOnBoard(x, y, clickedCell);
        } else {
          setSelectedHandPiece(null);
        }
      }
      return;
    }

    // 2. Handle Move Execution
    if (gameState.selectedPosition) {
      const isTarget = validMoves.some(m => m.x === x && m.y === y);
      if (isTarget) {
        const from = gameState.selectedPosition;
        const piece = gameState.board[from.y][from.x]!;

        // Check promotion
        if (canPromote(piece, from.y, y)) {
          // If forced promotion (e.g. Pawn/Lance at end), auto promote? 
          // For simplicity, always ask or auto-promote if no choice (not implemented yet)
          // Let's show dialog
          setShowPromotionDialog({ from, to: { x, y } });
        } else {
          setGameState(executeMove(gameState, from, { x, y }, false));
          setValidMoves([]);
        }
        return;
      }
    }

    // 3. Handle Selection
    if (clickedCell && isOwnPiece) {
      selectPieceOnBoard(x, y, clickedCell);
    } else {
      // Deselect
      setGameState(prev => prev ? ({ ...prev, selectedPosition: null }) : null);
      setValidMoves([]);
    }
  };

  const selectPieceOnBoard = (x: number, y: number, piece: Piece) => {
    setGameState(prev => prev ? ({ ...prev, selectedPosition: { x, y } }) : null);
    setSelectedHandPiece(null);
    const moves = getValidMoves(gameState.board, piece, { x, y });
    setValidMoves(moves);
  };

  const handleHandPieceClick = (piece: Piece) => {
    if (showPromotionDialog) return;
    if (piece.owner !== gameState.turn) return;

    setSelectedHandPiece(piece);
    setGameState(prev => prev ? ({ ...prev, selectedPosition: null }) : null);
    setValidMoves([]); // Clear board moves
    // TODO: Highlight valid drop zones?
  };

  const handlePromotion = (promote: boolean) => {
    if (!showPromotionDialog || !gameState) return;
    const { from, to } = showPromotionDialog;
    setGameState(executeMove(gameState, from, to, promote));
    setShowPromotionDialog(null);
    setValidMoves([]);
  };

  return (
    <main className={styles.main}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>将棋 Online</h1>
          <div className={styles.turnIndicator}>
            手番: {gameState.turn === 'sente' ? '先手 (Sente)' : '後手 (Gote)'}
          </div>
        </div>

        <div className={styles.boardArea}>
          <div className={styles.goteSide}>
            <Komadai
              owner="gote"
              pieces={gameState.hands.gote}
              onPieceClick={handleHandPieceClick}
              selectedPieceId={selectedHandPiece?.id || null}
            />
            <div className={styles.playerLabel}>後手</div>
          </div>

          <Board
            board={gameState.board}
            selectedPos={gameState.selectedPosition}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            lastMove={gameState.history[gameState.history.length - 1]}
          />

          <div className={styles.senteSide}>
            <Komadai
              owner="sente"
              pieces={gameState.hands.sente}
              onPieceClick={handleHandPieceClick}
              selectedPieceId={selectedHandPiece?.id || null}
            />
            <div className={styles.playerLabel}>先手</div>
          </div>
        </div>
      </div>

      {showPromotionDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>成りますか？ (Promote?)</p>
            <div className={styles.modalButtons}>
              <button onClick={() => handlePromotion(true)} className={styles.primaryBtn}>成る (Yes)</button>
              <button onClick={() => handlePromotion(false)} className={styles.secondaryBtn}>成らない (No)</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
