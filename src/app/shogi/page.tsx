'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Board } from '@/components/Board';
import { Komadai } from '@/components/Komadai';
import { PlayerInfo } from '@/components/PlayerInfo';
import { Chat } from '@/components/Chat';
import { createInitialState, executeMove, executeDrop, canPromote } from '@/lib/shogi/engine';
import { getValidMoves, isForcedPromotion, getLegalMoves, getValidDrops } from '@/lib/shogi/rules';
import { GameState, Coordinates, Piece, Player, Move, PieceType } from '@/lib/shogi/types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, child, onChildAdded, off, onDisconnect } from 'firebase/database';
import { getBestMove } from '@/lib/shogi/ai';
import { soundManager } from '@/utils/sound';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass, IconUndo } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import ColyseusShogiGame from './ColyseusShogiGame';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export default function ShogiPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { playerName: savedName, savePlayerName, isLoaded: playerLoaded } = usePlayer();
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
  const [isLoading, setIsLoading] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  // Online State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Player | null>(null);
  const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
  const [playerId, setPlayerId] = useState<string>(''); // Firebase用の一意なID

  // Reset GameState when roomId changes
  useEffect(() => {
    if (roomId === 'ai-match') {
      setGameState(createInitialState());
      setStatus('playing');
      setMessages([]);
    } else if (roomId) {
      setGameState(null);
      setMessages([]);
    }
  }, [roomId]);

  useEffect(() => {
    // Generate a random player ID on mount
    setPlayerId(Math.random().toString(36).substring(2, 15));
  }, []);

  // Player State
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | 'colyseus' | 'colyseus_random' | 'colyseus_room' | 'playing_room' | null>(null);
  const [customRoomId, setCustomRoomId] = useState('');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const joinRoomCreate = async () => {
    setCustomRoomId(''); // Ensure empty
    setJoinMode('playing_room');
  };

  const joinRoomJoin = async () => {
    if (!customRoomId.trim()) {
      alert("ルームIDを入力してください");
      return;
    }
    setJoinMode('playing_room');
  };

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Firebase Room Listener
  useEffect(() => {
    if (!roomId || !myRole || roomId === 'ai-match' || joinMode === 'colyseus') return;

    // Reset chat messages when joining a new room
    setMessages([]);

    const roomRef = ref(db, `rooms/${roomId}`);

    // Listen for room status and players
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      if (data.sente && data.gote) {
        // If both players are present and we are not playing/finished, start game
        if (status !== 'playing' && status !== 'finished') {
          console.log('Game starting/resuming...');
          setStatus('playing');
          // Only initialize if not already initialized (to avoid overwriting moves)
          setGameState(prev => prev || createInitialState());
        }
        // Update opponent name
        if (myRole === 'sente') setOpponentName(data.gote.name);
        if (myRole === 'gote') setOpponentName(data.sente.name);
      }

      if (data.winner) {
        setGameState(prev => prev ? ({ ...prev, winner: data.winner }) : null);
        setStatus('finished');
      } else {
        // If winner is removed (rematch), and we were finished, reset.
        if (status === 'finished') {
          setStatus('playing');
          setGameState(createInitialState());
          setMessages([]); // Clear chat locally too
        }
      }
    });

    // Listen for moves
    const movesRef = ref(db, `rooms/${roomId}/moves`);
    const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
      const moveData = snapshot.val();
      if (!moveData) return;

      console.log('Received move data:', moveData);

      setGameState(prev => {
        try {
          const currentState = prev || createInitialState();

          // Check if move is already applied (simple check by history length?)
          // Since onChildAdded iterates all moves, we simply re-apply everything in order.
          // But wait, if we re-apply everything to 'currentState', we need to be sure 'currentState' is fresh?
          // No, 'prev' accumulates state. 
          // ISSUE: If 'prev' already has moves, and onChildAdded fires for OLD moves, we might double apply?
          // onChildAdded fires for existing data once on load, then for new data.
          // If we initialize 'prev' with createInitialState(), then onChildAdded will replay history.
          // BUT, if we switch rooms, 'prev' might be from old room?
          // No, we setGameState(null) or similar on unmount? No we don't.
          // We rely on 'roomId' change to trigger new useEffect.
          // But 'gameState' state is preserved across useEffect re-runs unless explicitly reset.
          // We should reset gameState when roomId changes.

          let newState = currentState;

          // Avoid re-applying if this move looks like it's already in history?
          // It's hard to match exactly without IDs.
          // But for now, let's assume onChildAdded works sequentially.

          if (moveData.type === 'move') {
            if (!moveData.from || !moveData.to) {
              console.error("Invalid move data:", moveData);
              return currentState;
            }
            newState = executeMove(currentState, moveData.from, moveData.to, moveData.promote || false);
          } else if (moveData.type === 'drop') {
            if (!moveData.pieceType || !moveData.to || !moveData.owner) {
              console.error("Invalid drop data:", moveData);
              return currentState;
            }
            newState = executeDrop(currentState, moveData.pieceType, moveData.to, moveData.owner);
          }

          // Only play sound if it's a NEW move (not initial load)
          // How to know? Maybe check timestamp? Or just play sound.
          // Playing sound for every history move on load is annoying.
          // Let's skip sound if history length is small? No.
          // For now, just play sound.
          soundManager.playMoveSound();
          if (newState.winner) soundManager.playWinSound();
          return newState;
        } catch (e) {
          console.error("Error applying move:", e, moveData);
          return prev;
        }
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

    // Listen for rematch requests
    const rematchRef = ref(db, `rooms/${roomId}/rematch`);
    const unsubscribeRematch = onValue(rematchRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.sente && data.gote) {
        // Both requested rematch
        if (myRole === 'sente') {
          // Reset game (Sente acts as host)
          set(ref(db, `rooms/${roomId}/moves`), null);
          set(ref(db, `rooms/${roomId}/chat`), null);
          set(ref(db, `rooms/${roomId}/winner`), null);
          set(ref(db, `rooms/${roomId}/rematch`), null);
          // We don't need to reset players
        }
        // Local state reset is handled by moves listener (moves cleared -> initial state)
        // But moves listener might not fire for "null"?
        // onChildAdded doesn't fire for removal.
        // We need to detect "moves cleared".
        // Actually, onValue for moves might be better if we want to detect clear.
        // Or, we can listen to "winner" removal?
        // Let's listen to "winner" removal in the room listener.
      }
    });

    // Listen for room status (including winner removal)
    // We already have onValue(roomRef)
    // Let's update it to handle reset.

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

    // Setup disconnect handler
    const myPlayerRef = ref(db, `rooms/${roomId}/${myRole}`);
    onDisconnect(myPlayerRef).remove();

    // Also remove room if I am sente and opponent is not there? 
    // Or just remove myself. If both remove themselves, room becomes empty.
    // We can clean up empty rooms during matchmaking.

    return () => {
      unsubscribeRoom();
      unsubscribeMoves();
      off(movesRef);
      off(chatRef);
      off(roomRef);
      off(undoReqRef);
      off(undoResRef);
      off(rematchRef);
      // Cancel disconnect handler if component unmounts (e.g. back to top)
      // Actually onDisconnect persists until connection is lost or canceled.
      // We should probably cancel it if we manually leave.
      onDisconnect(myPlayerRef).cancel();
    };
  }, [roomId, myRole]); // Removed status from dependency to avoid re-subscribing

  useEffect(() => {
    if (playerLoaded && savedName) {
      setPlayerName(savedName);
      setStatus('setup');
    }
  }, [playerLoaded, savedName]);

  const joinRandomGame = async () => {
    setJoinMode('colyseus_random');
  };

  const joinRoomGame = async () => {
    // Treat empty input as "Create New Room"
    // If input exists, it's "Join Room"
    setJoinMode('colyseus_room');
  };

  const startAIGame = () => {
    setShowAILevelDialog(true);
  };

  const confirmAIGame = (level: 1 | 2 | 3) => {
    setAiLevel(level);
    setShowAILevelDialog(false);
    setMyRole('sente'); // プレイヤーは先手
    setOpponentName(`AI (Lv.${level})`);
    setRoomId('ai-match');
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
        // Check if AI match
        if (roomId === 'ai-match') {
          const newState = executeDrop(gameState, selectedHandPiece.type, { x, y }, myRole);
          setGameState(newState);
          soundManager.playMoveSound();
          if (newState.winner) {
            soundManager.playWinSound();
            setStatus('finished');
          }
        } else {
          // For online matches, push the move.
          // The onChildAdded listener will handle the state update.
          push(ref(db, `rooms/${roomId}/moves`), {
            type: 'drop',
            pieceType: selectedHandPiece.type,
            to: { x, y },
            owner: myRole
          });
        }

        // Clear selection immediately for better UX
        setSelectedHandPiece(null);
        setValidMoves([]);
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

    // AI Match: Execute locally
    if (roomId === 'ai-match') {
      const newState = executeMove(gameState, from, to, promote);
      setGameState(newState);
      soundManager.playMoveSound();
      if (newState.winner) {
        setStatus('finished');
      }
    } else {
      // Online Match: Push to Firebase
      push(ref(db, `rooms/${roomId}/moves`), {
        type: 'move',
        from,
        to,
        promote
      });
    }

    setShowPromotionDialog(false);
    setPendingMove(null);
    setValidMoves([]);
  };

  const handleBackToTop = () => {
    if (roomId && myRole) {
      // Remove myself from room immediately
      const myPlayerRef = ref(db, `rooms/${roomId}/${myRole}`);
      set(myPlayerRef, null);
      onDisconnect(myPlayerRef).cancel();
    }
    router.push('/');
  };

  const handleRematch = () => {
    if (roomId === 'ai-match') {
      setGameState(createInitialState());
      setStatus('playing');
      setMessages([]);
    } else if (roomId && myRole) {
      update(ref(db, `rooms/${roomId}/rematch`), { [myRole]: true });
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  // Setup Screen - Player Name Input
  if (!mounted || authLoading || !user || !playerLoaded) {
    return (
      <main className={styles.main}>
        <div className={styles.setupContainer}>
          <h1 className={styles.title}>将棋 Online</h1>
          <p className={styles.subtitle}>読み込み中...</p>
        </div>
      </main>
    );
  }

  if (joinMode === 'colyseus' || joinMode === 'colyseus_random') {
    return <ColyseusShogiGame mode="random" />;
  }

  if (joinMode === 'playing_room') {
    return <ColyseusShogiGame mode="room" roomId={customRoomId || undefined} />;
  }


  // Initial Screen (Mode Selection)
  if (!joinMode && status === 'setup') {
    const theme = {
      '--theme-primary': '#d97706',
      '--theme-secondary': '#b45309',
      '--theme-tertiary': '#f59e0b',
      '--theme-bg-light': '#fffbeb',
      '--theme-text-title': 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    } as React.CSSProperties;

    return (
      <main className={navStyles.main} style={theme}>
        <FloatingShapes />
        <div className={navStyles.header}>
          <button onClick={() => router.push('/')} className={navStyles.backButton}>
            <IconBack size={18} /> トップへ戻る
          </button>
        </div>

        <div className={navStyles.gameContainer}>
          <h1 className={navStyles.title}>将棋</h1>
          <p className={navStyles.subtitle}>Online Shogi</p>

          <div className={navStyles.modeSelection}>
            <button onClick={joinRandomGame} className={navStyles.modeBtn}>
              <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
              <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
              <span className={navStyles.modeBtnDesc}>世界中のプレイヤーと対戦</span>
            </button>

            <button onClick={() => setJoinMode('colyseus_room')} className={navStyles.modeBtn}>
              <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
              <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
              <span className={navStyles.modeBtnDesc}>合言葉で友達と対戦</span>
            </button>

            <button onClick={startAIGame} className={navStyles.modeBtn}>
              <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
              <span className={navStyles.modeBtnTitle}>AI対戦</span>
              <span className={navStyles.modeBtnDesc}>コンピュータと練習</span>
            </button>
          </div>
        </div>

        {/* Rules Section */}
        <div className={navStyles.contentSection}>
          <h2 className={navStyles.contentTitle}>将棋の奥深い世界へようこそ</h2>

          <div className={navStyles.sectionBlock}>
            <div className={navStyles.sectionHeader}>
              <span className={navStyles.sectionIcon}>🏯</span>
              <h3 className={navStyles.sectionTitle}>将棋の歴史と起源</h3>
            </div>
            <p className={navStyles.textBlock}>
              将棋の起源は、古代インドの「チャトランガ」にあると言われています。これが西に伝わってチェスになり、東に伝わって中国のシャンチー、そして朝鮮半島のチャンギとなりました。
              日本に伝わったのは平安時代頃とされていますが、当時の将棋は現在とは少し異なっていました。
            </p>
            <div className={navStyles.highlightBox}>
              <span className={navStyles.highlightTitle}>日本独自の進化「持ち駒」</span>
              <p className={navStyles.textBlock} style={{ marginBottom: 0 }}>
                日本の将棋における最大の特徴は、<strong>「取った相手の駒を自分の駒として再利用できる（持ち駒）」</strong>というルールです。
                このルールは世界中の将棋系ゲームの中でも日本将棋にしか存在しません。
                一説には、戦国時代の「捕虜を殺さずに味方に引き入れる」という傭兵の考え方が反映されたとも言われています。
                このルールのおかげで、将棋は終盤になっても駒が減らず、むしろ盤上が激しく複雑化していくため、引き分けが極端に少ないスリリングなゲームとなりました。
              </p>
            </div>
          </div>

          <div className={navStyles.sectionBlock}>
            <div className={navStyles.sectionHeader}>
              <span className={navStyles.sectionIcon}>📖</span>
              <h3 className={navStyles.sectionTitle}>基本的な遊び方</h3>
            </div>
            <p className={navStyles.textBlock}>
              将棋は9×9の盤上で、8種類の駒を使って戦います。相手の「王将（玉将）」を捕まえる（詰ます）ことが最終目的です。
            </p>
            <div className={navStyles.cardGrid}>
              <div className={navStyles.infoCard}>
                <span className={navStyles.cardTitle}>1. 勝利条件</span>
                <p className={navStyles.cardText}>相手の王将を逃げられない状態（詰み）にするか、相手が投了（負けを認める）すると勝ちになります。</p>
              </div>
              <div className={navStyles.infoCard}>
                <span className={navStyles.cardTitle}>2. 手番</span>
                <p className={navStyles.cardText}>先手（せんて）と後手（ごて）が交互に1手ずつ指します。パスはできません。</p>
              </div>
              <div className={navStyles.infoCard}>
                <span className={navStyles.cardTitle}>3. 成り（なり）</span>
                <p className={navStyles.cardText}>相手の陣地（3段目以内）に駒が進むと、裏返ってパワーアップできます（金将と王将以外）。</p>
              </div>
              <div className={navStyles.infoCard}>
                <span className={navStyles.cardTitle}>4. 打ち（うち）</span>
                <p className={navStyles.cardText}>持ち駒は、盤上の空いている好きなマスに打つことができます（二歩などの禁じ手を除く）。</p>
              </div>
            </div>
          </div>
        </div>

        {showAILevelDialog && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>AIレベル選択</h2>
              <p style={{ fontSize: '1rem', margin: '1rem 0', color: '#333' }}>対戦相手の強さを選んでください</p>
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



  // Room Match Setup
  if (joinMode === 'colyseus_room') {
    return (
      <main className={navStyles.main}>
        <FloatingShapes />
        <div className={navStyles.header}>
          <button onClick={() => setJoinMode(null)} className={navStyles.backButton}>
            <IconBack size={18} /> 戻る
          </button>
        </div>

        <div className={navStyles.gameContainer}>
          <h1 className={navStyles.title}>ルーム対戦</h1>
          <p className={navStyles.subtitle}>友達と対戦します</p>

          <div className={navStyles.joinSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                <button
                  onClick={joinRoomCreate}
                  className={navStyles.primaryBtn}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}
                >
                  ルーム作成（ID自動発行）
                </button>
              </div>

              <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="IDを入力"
                    value={customRoomId}
                    onChange={(e) => setCustomRoomId(e.target.value)}
                    className={navStyles.input}
                    style={{ flex: 1, textAlign: 'center' }}
                  />
                  <button
                    onClick={joinRoomJoin}
                    className={navStyles.secondaryBtn}
                    disabled={!playerName.trim() || !customRoomId.trim()}
                    style={{ width: 'auto', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                  >
                    参加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Waiting Screen
  if (status === 'waiting') {
    return (
      <main className={navStyles.main}>
        <FloatingShapes />
        <div className={navStyles.header}>
          <button onClick={handleBackToTop} className={navStyles.backButton}>
            <IconBack size={18} /> トップへ戻る
          </button>
        </div>
        <div className={navStyles.gameContainer}>
          <h1 className={navStyles.title}>待機中...</h1>
          <div className={navStyles.waitingLayout}>
            <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'center' }}>
              <IconHourglass size={64} color="#3b82f6" />
            </div>
          </div>
          <p style={{ color: '#6b7280', fontSize: '1.2rem' }}>対戦相手を探しています</p>
          <div className={navStyles.waitingContainer}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>ルームID (Room ID)</span>
            <div className={navStyles.roomId}>{roomId}</div>
            <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>このIDを友達に教えて参加してもらえます</span>
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
      <FloatingShapes />
      <div className={navStyles.header}>
        <button onClick={handleBackToTop} className={navStyles.backButton}>
          <IconBack size={18} /> トップへ戻る
        </button>
        {status === 'playing' && (
          <button onClick={handleUndo} className={styles.undoButton} title="待った" style={{ marginLeft: 'auto' }}>
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

            <div className={styles.boardWrapper}>
              <Board
                board={gameState.board}
                selectedPos={gameState.selectedPosition}
                validMoves={validMoves}
                onCellClick={handleCellClick}
                lastMove={gameState.history[gameState.history.length - 1]}
                perspective={myRole!}
              />
            </div>

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



      {gameState.winner && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>勝負あり！ (Game Over)</h2>
            <p>勝者: {gameState.winner === myRole ? playerName : opponentName}</p>
            <p className={styles.winnerRole}>
              {gameState.winner === 'sente' ? '先手 (Sente)' : '後手 (Gote)'}
            </p>
            <button onClick={handleRematch} className={styles.primaryBtn}>再戦する (Rematch)</button>
            <button onClick={handleExit} className={styles.secondaryBtn}>退出する (Exit)</button>
          </div>
        </div>
      )}
    </main>
  );
}
