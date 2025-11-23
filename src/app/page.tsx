'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Board } from '@/components/Board';
import { Komadai } from '@/components/Komadai';
import { PlayerInfo } from '@/components/PlayerInfo';
import { Chat } from '@/components/Chat';
import { createInitialState, executeMove, executeDrop, canPromote } from '@/lib/shogi/engine';
import { getValidMoves, isForcedPromotion, getLegalMoves, getValidDrops } from '@/lib/shogi/rules';
import { GameState, Coordinates, Piece, Player, Move, PieceType } from '@/lib/shogi/types';
import { getSocket } from '@/lib/socket';
import { getBestMove } from '@/lib/shogi/ai';
import { soundManager } from '@/utils/sound';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass, IconUndo } from '@/components/Icons';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<Coordinates[]>([]);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showAILevelDialog, setShowAILevelDialog] = useState(false);
  const [aiLevel, setAiLevel] = useState<1 | 2 | 3>(1);
  const [showCheckEffect, setShowCheckEffect] = useState(false);
  const [undoRequest, setUndoRequest] = useState<{ requester: string } | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: Coordinates, to: Coordinates } | null>(null);

  // Online State
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Player | null>(null);
  const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');

  // Player State
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | null>(null);
  const [customRoomId, setCustomRoomId] = useState('');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('waiting', ({ roomId, role }) => {
      setRoomId(roomId);
      setMyRole(role);
      setStatus('waiting');
    });

    socket.on('game_start', ({ roomId, role, opponentName }) => {
      setRoomId(roomId);
      setMyRole(role);
      setOpponentName(opponentName);
      setStatus('playing');
      setGameState(createInitialState());
    });

    socket.on('opponent_joined', ({ opponentName }) => {
      setOpponentName(opponentName);
      setStatus('playing');
      setGameState(createInitialState());
    });

    socket.on('opponent_move', (move: { from: Coordinates, to: Coordinates, promote: boolean }) => {
      setGameState(prev => {
        if (!prev) return null;
        const newState = executeMove(prev, move.from, move.to, move.promote);
        soundManager.playMoveSound();
        if (newState.winner) soundManager.playWinSound();
        return newState;
      });
    });

    socket.on('opponent_drop', (drop: { pieceType: PieceType, to: Coordinates, owner: Player }) => {
      console.log('Received opponent_drop:', drop);
      setGameState(prev => {
        if (!prev) {
          console.log('No game state, ignoring drop');
          return null;
        }
        const opponent: Player = drop.owner; // Use owner from drop data
        console.log(`Executing drop for opponent: ${opponent}`, drop);
        const newState = executeDrop(prev, drop.pieceType, drop.to, opponent);
        if (newState === prev) {
          console.error('Drop failed - state unchanged. Check rules or engine error.', drop);
        } else {
          console.log('Drop successful - state updated');
          soundManager.playMoveSound();
          if (newState.winner) soundManager.playWinSound();
        }
        return newState;
      });
    });

    socket.on('game_over', ({ winner }) => {
      setGameState(prev => prev ? ({ ...prev, winner }) : null);
      setStatus('finished');
    });

    socket.on('opponent_disconnected', () => {
      alert('対戦相手が切断しました');
      window.location.reload();
    });

    socket.on('room_full', ({ roomId }) => {
      alert(`ルーム ${roomId} は満員です`);
      setStatus('initial');
    });

    socket.on('chat_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('undo_request', ({ requester }) => {
      setUndoRequest({ requester });
    });

    socket.on('undo_denied', () => {
      alert('待ったが拒否されました。');
    });

    socket.on('undo_executed', () => {
      performUndo();
    });

    return () => {
      socket.off('connect');
      socket.off('waiting');
      socket.off('game_start');
      socket.off('opponent_joined');
      socket.off('opponent_move');
      socket.off('opponent_drop');
      socket.off('game_over');
      socket.off('opponent_disconnected');
      socket.off('room_full');
      socket.off('chat_message');
      socket.off('undo_request');
      socket.off('undo_denied');
      socket.off('undo_executed');
    };
  }, [mounted]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setStatus('initial');
    }
  };

  const joinRandomGame = () => {
    const socket = getSocket();
    socket.emit('join_game', { playerName });
  };

  const joinRoomGame = () => {
    if (customRoomId.trim()) {
      const socket = getSocket();
      socket.emit('join_room', { roomId: customRoomId.trim(), playerName });
    }
  };

  const startAIGame = () => {
    setShowAILevelDialog(true);
  };

  const confirmAIGame = (level: 1 | 2 | 3) => {
    setAiLevel(level);
    setShowAILevelDialog(false);
    setRoomId('ai-match');
    setMyRole('sente'); // プレイヤーは先手
    setOpponentName(`AI (Lv.${level})`);
    setStatus('playing');
    setGameState(createInitialState());
  };

  // AI Turn Logic
  useEffect(() => {
    if (roomId !== 'ai-match' || !gameState || gameState.turn !== 'gote' || status !== 'playing') return;

    const timer = setTimeout(() => {
      const aiMove = getBestMove(gameState, 'gote', aiLevel);
      if (aiMove) {
        if (aiMove.type === 'move') {
          const newState = executeMove(gameState, aiMove.from, aiMove.to, aiMove.promote);
          setGameState(newState);
          soundManager.playMoveSound();
          if (newState.winner) {
            soundManager.playWinSound();
            setStatus('finished');
          }
        } else {
          const newState = executeDrop(gameState, aiMove.pieceType, aiMove.to, 'gote');
          setGameState(newState);
          soundManager.playMoveSound();
          if (newState.winner) {
            soundManager.playWinSound();
            setStatus('finished');
          }
        }
      }
    }, 1000); // 1秒考えてから打つ

    return () => clearTimeout(timer);
  }, [gameState, roomId, status, aiLevel]);

  // 王手エフェクトの制御
  useEffect(() => {
    if (!gameState || !myRole) return;
    if (gameState.isCheck && gameState.turn === myRole) {
      setShowCheckEffect(true);
      // playCheckSound(); // TODO: Add check sound
      const timer = setTimeout(() => setShowCheckEffect(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.isCheck, gameState?.turn, myRole]);

  const performUndo = () => {
    console.log('performUndo called');
    setGameState(prev => {
      if (!prev) return null;
      console.log('Current history length:', prev.history.length);
      if (prev.history.length < 2) {
        console.log('Not enough history to undo');
        return prev;
      }
      const newHistory = prev.history.slice(0, -2); // Remove the last 2 moves
      let newState = createInitialState();

      for (const move of newHistory) {
        if (move.from === 'hand') {
          newState = executeDrop(newState, move.piece.type, move.to, move.piece.owner);
        } else {
          newState = executeMove(newState, move.from as Coordinates, move.to, move.isPromotion || false);
        }
      }
      return newState;
    });
  };

  const handleUndo = () => {
    console.log('handleUndo called', { roomId, status, historyLength: gameState?.history.length });
    if (!gameState || status !== 'playing') return;

    if (roomId === 'ai-match') {
      performUndo();
    } else if (roomId) {
      const socket = getSocket();
      socket.emit('request_undo', { roomId, requester: playerName });
    }
  };

  const handleUndoResponse = (allow: boolean) => {
    if (roomId) {
      const socket = getSocket();
      socket.emit('respond_undo', { roomId, allow });
      setUndoRequest(null);
    }
  };

  const handleSendMessage = (text: string) => {
    if (roomId === 'ai-match') {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: playerName || 'Player',
        text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);

      setTimeout(() => {
        const aiResponses = ['ふむ...', 'なるほど', '良い手ですね', '考え中...'];
        const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        const aiMessage: ChatMessage = {
          id: `ai-msg-${Date.now()}`,
          sender: `AI (Lv.${aiLevel})`,
          text: randomResponse,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1500);
      return;
    }

    if (roomId) {
      const socket = getSocket();
      socket.emit('chat_message', { roomId, message: text });
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (showPromotionDialog || !gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;

    const clickedCell = gameState.board[y][x];
    const isOwnPiece = clickedCell?.owner === gameState.turn;

    // 1. Handle Drop
    if (selectedHandPiece) {
      if (!clickedCell) {
        const newState = executeDrop(gameState, selectedHandPiece.type, { x, y });
        if (newState !== gameState) {
          console.log('Executing drop locally:', { pieceType: selectedHandPiece.type, to: { x, y } });
          setGameState(newState);
          setSelectedHandPiece(null);
          setValidMoves([]);
          soundManager.playMoveSound();

          // Emit drop
          if (roomId !== 'ai-match') {
            const socket = getSocket();
            console.log('Emitting drop to server:', { roomId, drop: { pieceType: selectedHandPiece.type, to: { x, y }, owner: myRole } });
            socket.emit('drop', {
              roomId,
              drop: { pieceType: selectedHandPiece.type, to: { x, y }, owner: myRole }
            });

            if (newState.winner) {
              socket.emit('game_over', { roomId, winner: newState.winner });
            }
          }
        } else {
          console.log('Drop failed - state unchanged');
        }
      } else {
        if (isOwnPiece) {
          setGameState({ ...gameState, selectedPosition: { x, y } });
          setSelectedHandPiece(null);
          const moves = getLegalMoves(gameState.board, clickedCell, { x, y });
          setValidMoves(moves);
        } else {
          setSelectedHandPiece(null);
        }
      }
      return;
    }

    // 2. Handle Move Execution or Selection
    if (gameState.selectedPosition) {
      const isTarget = validMoves.some(m => m.x === x && m.y === y);
      if (isTarget) {
        const from = gameState.selectedPosition;
        const piece = gameState.board[from.y][from.x]!;

        // Check promotion
        if (isForcedPromotion(piece, y)) {
          handlePromotion(true, { from, to: { x, y } });
        } else if (canPromote(piece, from.y, y)) {
          setPendingMove({ from, to: { x, y } });
          setShowPromotionDialog(true);
        } else {
          handlePromotion(false, { from, to: { x, y } });
        }
        return;
      }
    }

    // 3. Handle Selection
    if (clickedCell && isOwnPiece) {
      setGameState(prev => prev ? ({ ...prev, selectedPosition: { x, y } }) : null);
      setSelectedHandPiece(null);
      const moves = getLegalMoves(gameState.board, clickedCell, { x, y });
      setValidMoves(moves);
    } else {
      setGameState(prev => prev ? ({ ...prev, selectedPosition: null }) : null);
      setValidMoves([]);
    }
  };

  const handleHandPieceClick = (piece: Piece) => {
    if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;
    if (piece.owner !== gameState.turn) return;

    setSelectedHandPiece(piece);
    setGameState(prev => prev ? ({ ...prev, selectedPosition: null }) : null);

    const drops = getValidDrops(gameState.board, piece, gameState.turn, gameState.hands);
    setValidMoves(drops);
  };

  const handlePromotion = (promote: boolean, move?: { from: Coordinates, to: Coordinates }) => {
    const moveData = move || pendingMove;
    if (!moveData || !gameState) return;

    const { from, to } = moveData;
    const newState = executeMove(gameState, from, to, promote);
    setGameState(newState);
    soundManager.playMoveSound();

    // Emit move
    if (roomId !== 'ai-match') {
      const socket = getSocket();
      socket.emit('move', {
        roomId,
        move: { from, to, promote }
      });

      if (newState.winner) {
        socket.emit('game_over', { roomId, winner: newState.winner });
      }
    }

    setShowPromotionDialog(false);
    setPendingMove(null);
    setValidMoves([]);
  };

  const handleBackToTop = () => {
    if (status === 'playing') {
      setShowExitDialog(true);
    } else {
      setStatus('setup');
      setJoinMode(null);
      setRoomId(null);
    }
  };

  // Setup Screen - Player Name Input
  if (!mounted) {
    return (
      <main className={styles.main}>
        <div className={styles.setupContainer}>
          <h1 className={styles.title}>将棋 Online</h1>
          <p className={styles.subtitle}>読み込み中...</p>
        </div>
      </main>
    );
  }

  if (status === 'setup') {
    return (
      <main className={styles.main}>
        <div className={styles.setupContainer}>
          <h1 className={styles.title}>将棋 Online</h1>
          <p className={styles.subtitle}>オンライン対戦将棋</p>

          <form onSubmit={handleNameSubmit} className={styles.setupForm}>
            <label className={styles.label}>プレイヤー名を入力してください</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="プレイヤー名"
              className={styles.input}
              maxLength={20}
              autoFocus
            />
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={!playerName.trim()}
            >
              次へ
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Initial Screen - Join Mode Selection
  if (status === 'initial') {
    return (
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={handleBackToTop} className={styles.backButton}>
            <IconBack size={18} /> トップへ戻る
          </button>
        </div>
        <div className={styles.gameContainer}>
          <h1 className={styles.title}>将棋 Online</h1>
          <p className={styles.welcomeText}>ようこそ、{playerName}さん!</p>

          {!joinMode ? (
            <div className={styles.modeSelection}>
              <button onClick={joinRandomGame} className={styles.modeBtn}>
                <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
              </button>

              <button onClick={() => setJoinMode('room')} className={styles.modeBtn}>
                <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                <span className={styles.modeBtnTitle}>ルーム対戦</span>
                <span className={styles.modeBtnDesc}>友達と対戦</span>
              </button>

              <button onClick={startAIGame} className={styles.modeBtn}>
                <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                <span className={styles.modeBtnTitle}>AI対戦</span>
                <span className={styles.modeBtnDesc}>練習モード (Lv.1-3)</span>
              </button>
            </div>
          ) : joinMode === 'random' ? (
            <div className={styles.joinSection}>
              <p className={styles.joinDesc}>ランダムな対戦相手とマッチングします</p>
              <button onClick={joinRandomGame} className={styles.primaryBtn}>
                対戦を始める
              </button>
              <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>
                戻る
              </button>
            </div>
          ) : (
            <div className={styles.joinSection}>
              <p className={styles.joinDesc}>ルームIDを入力して参加</p>
              <input
                type="text"
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
                placeholder="ルームID (空白で新規作成)"
                className={styles.input}
                maxLength={20}
              />
              <button onClick={joinRoomGame} className={styles.primaryBtn}>
                参加 / 作成
              </button>
              <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>
                戻る
              </button>
            </div>
          )}
        </div>

        {showAILevelDialog && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>AIレベル選択</h2>
              <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>対戦相手の強さを選んでください</p>
              <div className={styles.levelButtons}>
                <button onClick={() => confirmAIGame(1)} className={styles.levelBtn}>
                  <span className={styles.levelTitle}>Lv.1 入門 (Beginner)</span>
                  <span className={styles.levelDesc}>ランダム要素あり。将棋を覚えたての方に。</span>
                </button>
                <button onClick={() => confirmAIGame(2)} className={styles.levelBtn}>
                  <span className={styles.levelTitle}>Lv.2 初級 (Intermediate)</span>
                  <span className={styles.levelDesc}>1手先を読みます。基本的な攻めを行います。</span>
                </button>
                <button onClick={() => confirmAIGame(3)} className={styles.levelBtn}>
                  <span className={styles.levelTitle}>Lv.3 中級 (Advanced)</span>
                  <span className={styles.levelDesc}>2手先を読み、評価関数で判断します。</span>
                </button>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button onClick={() => setShowAILevelDialog(false)} className={styles.secondaryBtn}>キャンセル</button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Waiting Screen
  if (status === 'waiting') {
    return (
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={handleBackToTop} className={styles.backButton}>
            <IconBack size={18} /> トップへ戻る
          </button>
        </div>
        <div className={styles.gameContainer}>
          <h1 className={styles.title}>待機中...</h1>
          <div className={styles.waitingAnimation}><IconHourglass size={64} color="var(--color-primary)" /></div>
          <p>対戦相手を探しています</p>
          <div className={styles.roomInfo}>
            <p className={styles.roomLabel}>ルームID</p>
            <p className={styles.roomId}>{roomId}</p>
            <p className={styles.roomHint}>このIDを友達に教えて参加してもらえます</p>
          </div>
        </div>
      </main>
    );
  }

  if (!gameState) return null;

  const myHandCount = myRole === 'sente'
    ? gameState.hands.sente.length
    : gameState.hands.gote.length;

  const opponentHandCount = myRole === 'sente'
    ? gameState.hands.gote.length
    : gameState.hands.sente.length;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <button onClick={handleBackToTop} className={styles.backButton}>
          <IconBack size={18} /> トップへ戻る
        </button>
        {status === 'playing' && (
          <button onClick={handleUndo} className={styles.undoButton} title="待った">
            <IconUndo size={18} /> 待った
          </button>
        )}
      </div>
      <div className={styles.gameLayout}>
        <div className={styles.leftPanel}>
          <h1 className={styles.compactTitle}>将棋 Online</h1>

          <div className={styles.playersSection}>
            <PlayerInfo
              playerName={opponentName}
              role={myRole === 'sente' ? 'gote' : 'sente'}
              isMyTurn={gameState.turn !== myRole}
              capturedPiecesCount={opponentHandCount}
            />

            <PlayerInfo
              playerName={playerName}
              role={myRole!}
              isMyTurn={gameState.turn === myRole}
              capturedPiecesCount={myHandCount}
            />
          </div>

          <div className={styles.chatSection}>
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              myName={playerName}
            />
          </div>
        </div>

        <div className={styles.centerPanel}>
          <div className={styles.boardArea}>
            {/* 後手視点の場合は自分(gote)を下に、先手を上に表示 */}
            <div className={styles.goteSide}>
              <Komadai
                owner={myRole === 'gote' ? 'sente' : 'gote'}
                pieces={myRole === 'gote' ? gameState.hands.sente : gameState.hands.gote}
                onPieceClick={handleHandPieceClick}
                selectedPieceId={selectedHandPiece?.id || null}
              />
              <div className={styles.playerLabel}>{myRole === 'gote' ? '先手' : '後手'}</div>
            </div>

            <Board
              board={gameState.board}
              selectedPos={gameState.selectedPosition}
              validMoves={validMoves}
              onCellClick={handleCellClick}
              lastMove={gameState.history[gameState.history.length - 1]}
              perspective={myRole!}
            />

            <div className={styles.senteSide}>
              <Komadai
                owner={myRole === 'gote' ? 'gote' : 'sente'}
                pieces={myRole === 'gote' ? gameState.hands.gote : gameState.hands.sente}
                onPieceClick={handleHandPieceClick}
                selectedPieceId={selectedHandPiece?.id || null}
              />
              <div className={styles.playerLabel}>{myRole === 'gote' ? '後手' : '先手'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Check Effect */}
      {showCheckEffect && (
        <div className={styles.checkEffect}>
          <span className={styles.checkText}>王手！</span>
        </div>
      )}

      {/* Undo Request Dialog */}
      {undoRequest && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>待ったのリクエスト</h2>
            <p>{undoRequest.requester}が待ったを求めています。<br />許可しますか？</p>
            <div className={styles.modalButtons}>
              <button onClick={() => handleUndoResponse(true)} className={styles.primaryBtn}>許可する</button>
              <button onClick={() => handleUndoResponse(false)} className={styles.secondaryBtn}>拒否する</button>
            </div>
          </div>
        </div>
      )}

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

      {showExitDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>対局を終了してトップに戻りますか？</p>
            <div className={styles.modalButtons}>
              <button onClick={() => window.location.reload()} className={styles.primaryBtn}>はい</button>
              <button onClick={() => setShowExitDialog(false)} className={styles.secondaryBtn}>いいえ</button>
            </div>
          </div>
        </div>
      )}

      {showAILevelDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>AIレベル選択</h2>
            <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>対戦相手の強さを選んでください</p>
            <div className={styles.levelButtons}>
              <button onClick={() => confirmAIGame(1)} className={styles.levelBtn}>
                <span className={styles.levelTitle}>Lv.1 入門 (Beginner)</span>
                <span className={styles.levelDesc}>ランダム要素あり。将棋を覚えたての方に。</span>
              </button>
              <button onClick={() => confirmAIGame(2)} className={styles.levelBtn}>
                <span className={styles.levelTitle}>Lv.2 初級 (Intermediate)</span>
                <span className={styles.levelDesc}>1手先を読みます。基本的な攻めを行います。</span>
              </button>
              <button onClick={() => confirmAIGame(3)} className={styles.levelBtn}>
                <span className={styles.levelTitle}>Lv.3 中級 (Advanced)</span>
                <span className={styles.levelDesc}>2手先を読み、評価関数で判断します。</span>
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => setShowAILevelDialog(false)} className={styles.secondaryBtn}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {gameState.winner && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>勝負あり！ (Game Over)</h2>
            <p>勝者: {gameState.winner === myRole ? playerName : opponentName}</p>
            <p className={styles.winnerRole}>
              {gameState.winner === 'sente' ? '先手 (Sente)' : '後手 (Gote)'}
            </p>
            <button onClick={() => window.location.reload()} className={styles.primaryBtn}>もう一度遊ぶ (Play Again)</button>
          </div>
        </div>
      )}
    </main>
  );
}
