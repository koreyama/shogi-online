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
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, child, onChildAdded, off } from 'firebase/database';
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
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Player | null>(null);
  const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
  const [playerId, setPlayerId] = useState<string>(''); // Firebase用の一意なID

  useEffect(() => {
    // Generate a random player ID on mount
    setPlayerId(Math.random().toString(36).substring(2, 15));
  }, []);

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

  // Firebase Room Listener
  useEffect(() => {
    if (!roomId || roomId === 'ai-match') return;

    const roomRef = ref(db, `rooms/${roomId}`);

    // Listen for room status and players
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      if (data.sente && data.gote) {
        if (status === 'waiting') {
          setStatus('playing');
          setGameState(createInitialState());
        }
        // Update opponent name
        if (myRole === 'sente') setOpponentName(data.gote.name);
        if (myRole === 'gote') setOpponentName(data.sente.name);
      }

      if (data.winner) {
        setGameState(prev => prev ? ({ ...prev, winner: data.winner }) : null);
        setStatus('finished');
      }
    });

    // Listen for moves
    const movesRef = ref(db, `rooms/${roomId}/moves`);
    const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
      const moveData = snapshot.val();
      if (!moveData) return;

      setGameState(prev => {
        if (!prev) return createInitialState(); // Should not happen usually

        // Prevent re-applying the same move if we already have it in history (simple check)
        // But since we are rebuilding state from moves or applying sequentially, 
        // we need to be careful. 
        // For simplicity in this migration: We apply the move if it's new.
        // Actually, with onChildAdded, we get called for every existing move on load.
        // So we should probably just apply it.
        // However, we need to distinguish "Move" vs "Drop".

        let newState = prev;
        if (moveData.type === 'move') {
          // Check if this move is already the last one (to avoid duplication if re-loading)
          // But onChildAdded iterates all. 
          // We can check history length.
          // Or just trust the order.
          // Let's just execute.
          newState = executeMove(prev, moveData.from, moveData.to, moveData.promote);
        } else if (moveData.type === 'drop') {
          newState = executeDrop(prev, moveData.pieceType, moveData.to, moveData.owner);
        }

        soundManager.playMoveSound();
        if (newState.winner) soundManager.playWinSound();
        return newState;
      });
    });

    // Listen for chat
    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
      const msg = snapshot.val();
      if (msg) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    // Listen for undo request
    const undoReqRef = ref(db, `rooms/${roomId}/undoRequest`);
    const unsubscribeUndoReq = onChildAdded(undoReqRef, (snapshot) => {
      const req = snapshot.val();
      if (req) {
        if (req.requester !== playerName) {
          setUndoRequest({ requester: req.requester });
        }
      }
    });

    // Listen for undo response
    const undoResRef = ref(db, `rooms/${roomId}/undoResponse`);
    const unsubscribeUndoRes = onValue(undoResRef, (snapshot) => {
      const res = snapshot.val();
      if (res) {
        if (res.allow) {
          performUndo();
          set(ref(db, `rooms/${roomId}/undoResponse`), null);
          set(ref(db, `rooms/${roomId}/undoRequest`), null);
        } else {
          alert('待ったが拒否されました。');
          set(ref(db, `rooms/${roomId}/undoResponse`), null);
          set(ref(db, `rooms/${roomId}/undoRequest`), null);
        }
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMoves(); // onChildAdded returns unsubscribe function in newer SDKs? 
      // Actually onChildAdded returns Unsubscribe.
      off(movesRef); // Safe fallback
      off(chatRef);
      off(roomRef);
      off(undoReqRef);
      off(undoResRef);
    };
  }, [roomId, myRole]); // Removed status from dependency to avoid re-subscribing

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setStatus('initial');
    }
  };

  const joinRandomGame = async () => {
    const roomsRef = ref(db, 'rooms');
    const snapshot = await get(roomsRef);
    const rooms = snapshot.val();

    let foundRoomId = null;

    if (rooms) {
      // Find a room with only sente
      for (const [id, room] of Object.entries(rooms) as [string, any][]) {
        if (room.sente && !room.gote) {
          foundRoomId = id;
          break;
        }
      }
    }

    if (foundRoomId) {
      // Join as gote
      await update(ref(db, `rooms/${foundRoomId}/gote`), {
        name: playerName,
        id: playerId
      });
      setRoomId(foundRoomId);
      setMyRole('gote');
      // Status update handled by listener
    } else {
      // Create new room
      const newRoomRef = push(roomsRef);
      const newRoomId = newRoomRef.key!;
      await set(newRoomRef, {
        sente: { name: playerName, id: playerId },
        gote: null
      });
      setRoomId(newRoomId);
      setMyRole('sente');
      setStatus('waiting');
    }
  };

  const joinRoomGame = async () => {
    if (!customRoomId.trim()) return;
    const rid = customRoomId.trim();
    const roomRef = ref(db, `rooms/${rid}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val();

    if (!room) {
      // Create
      await set(roomRef, {
        sente: { name: playerName, id: playerId },
        gote: null
      });
      setRoomId(rid);
      setMyRole('sente');
      setStatus('waiting');
    } else if (!room.gote) {
      // Join
      await update(ref(db, `rooms/${rid}/gote`), {
        name: playerName,
        id: playerId
      });
      setRoomId(rid);
      setMyRole('gote');
      // Status update handled by listener
    } else {
      alert('満員です');
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
      push(ref(db, `rooms/${roomId}/undoRequest`), { requester: playerName });
    }
  };

  const handleUndoResponse = (allow: boolean) => {
    if (roomId) {
      set(ref(db, `rooms/${roomId}/undoResponse`), { allow });
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
      push(ref(db, `rooms/${roomId}/chat`), {
        id: `msg-${Date.now()}`,
        sender: playerName,
        text,
        timestamp: Date.now()
      });
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
            push(ref(db, `rooms/${roomId}/moves`), {
              type: 'drop',
              pieceType: selectedHandPiece.type,
              to: { x, y },
              owner: myRole
            });

            if (newState.winner) {
              update(ref(db, `rooms/${roomId}`), { winner: newState.winner });
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
      push(ref(db, `rooms/${roomId}/moves`), {
        type: 'move',
        from,
        to,
        promote
      });

      if (newState.winner) {
        update(ref(db, `rooms/${roomId}`), { winner: newState.winner });
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
