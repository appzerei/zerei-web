import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';


const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  onClose: () => void;
  onRelapsed: () => void;
  onThinking: () => void;
}

// ─── Ícones SVG ───────────────────────────────────────────────────────────────

function IconBrainDown(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C9.5 2 7.5 3.5 7 5.5C5.5 5.8 4 7 4 9C4 10.2 4.5 11.3 5.3 12C4.5 12.7 4 13.8 4 15C4 17.2 5.8 19 8 19H16C18.2 19 20 17.2 20 15C20 13.8 19.5 12.7 18.7 12C19.5 11.3 20 10.2 20 9C20 7 18.5 5.8 17 5.5C16.5 3.5 14.5 2 12 2Z" stroke="#4A5A8A" strokeWidth="1.5" strokeLinejoin="round"/>
      <Polyline points="9,14 12,17 15,14" stroke="#F27A5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="12" y1="10" x2="12" y2="17" stroke="#F27A5E" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function IconEyeWarning(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12C1 12 5 5 12 5C19 5 23 12 23 12C23 12 19 19 12 19C5 19 1 12 1 12Z" stroke="#4A5A8A" strokeWidth="1.5" strokeLinejoin="round"/>
      <Circle cx="12" cy="12" r="3" stroke="#4A5A8A" strokeWidth="1.5"/>
      <Path d="M12 8V10M12 14H12.01" stroke="#F27A5E" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

function IconHeartBroken(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21C12 21 3 15 3 8.5C3 5.4 5.4 3 8.5 3C10.2 3 11.7 3.8 12 5C12.3 3.8 13.8 3 15.5 3C18.6 3 21 5.4 21 8.5C21 15 12 21 12 21Z" stroke="#4A5A8A" strokeWidth="1.5" strokeLinejoin="round"/>
      <Path d="M12 5L10 10L13 12L11 17" stroke="#F27A5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IconFocus(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#4A5A8A" strokeWidth="1.5"/>
      <Circle cx="12" cy="12" r="4" stroke="#4A5A8A" strokeWidth="1.5"/>
      <Path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke="#F27A5E" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function IconEnergy(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" stroke="#4A5A8A" strokeWidth="1.5" strokeLinejoin="round"/>
      <Path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" stroke="#F27A5E" strokeWidth="1" strokeLinejoin="round" strokeDasharray="3 3"/>
    </Svg>
  );
}

// ─── Dados dos efeitos ────────────────────────────────────────────────────────

const EFEITOS = [
  { Icon: IconBrainDown,   titulo: 'NÉVOA MENTAL',      descricao: 'Perda de foco e dificuldade de concentração por dias.' },
  { Icon: IconEyeWarning,  titulo: 'DESSENSIBILIZAÇÃO',  descricao: 'Necessidade de estímulos cada vez mais intensos.' },
  { Icon: IconHeartBroken, titulo: 'RELACIONAMENTOS',    descricao: 'Menos presença e intimidade com quem você ama.' },
  { Icon: IconFocus,       titulo: 'PERDA DE CONTROLE',  descricao: 'Cada recaída torna o próximo passo mais difícil.' },
  { Icon: IconEnergy,      titulo: 'ENERGIA DRENADA',    descricao: 'Cansaço, falta de motivação e procrastinação.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// JOGO 1: BLOCOS (Tetris)
// ─────────────────────────────────────────────────────────────────────────────

const COLS = 10;
const ROWS = 20;
const CONTROLS_HEIGHT = 140;
const HEADER_HEIGHT = 120;
const AVAILABLE_H = SCREEN_H - CONTROLS_HEIGHT - HEADER_HEIGHT;
const CELL_BY_W = Math.floor((SCREEN_W - 48) / COLS);
const CELL_BY_H = Math.floor(AVAILABLE_H / ROWS);
const CELL = Math.min(CELL_BY_W, CELL_BY_H);

type Board = (string | null)[][];
type Piece = { shape: number[][]; color: string; x: number; y: number };

const TETROMINOS = [
  { shape: [[1,1,1,1]],         color: '#00D4FF' },
  { shape: [[1,1],[1,1]],       color: '#F5C518' },
  { shape: [[0,1,0],[1,1,1]],   color: '#B44FFF' },
  { shape: [[1,0],[1,0],[1,1]], color: '#F27A5E' },
  { shape: [[0,1],[0,1],[1,1]], color: '#3D54D9' },
  { shape: [[0,1,1],[1,1,0]],   color: '#4A9C52' },
  { shape: [[1,1,0],[0,1,1]],   color: '#FF6B6B' },
];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece(): Piece {
  const t = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
  return { shape: t.shape, color: t.color, x: Math.floor(COLS / 2) - 1, y: 0 };
}

function isValid(board: Board, piece: Piece, dx = 0, dy = 0, shape?: number[][]): boolean {
  const s = shape || piece.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function rotatePiece(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function placePiece(board: Board, piece: Piece): Board {
  const b = board.map(r => [...r]);
  piece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell && piece.y + r >= 0) {
        b[piece.y + r][piece.x + c] = piece.color;
      }
    });
  });
  return b;
}

function clearLines(board: Board): { board: Board; lines: number } {
  const newBoard = board.filter(row => row.some(cell => !cell));
  const lines = ROWS - newBoard.length;
  const empty = Array.from({ length: lines }, () => Array(COLS).fill(null));
  return { board: [...empty, ...newBoard], lines };
}

function BlocosGame({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [piece, setPiece] = useState<Piece>(randomPiece);
  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const gameOverRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  boardRef.current = board;
  pieceRef.current = piece;
  gameOverRef.current = gameOver;
  pausedRef.current = paused;

  const speed = Math.max(100, 600 - Math.floor(lines / 10) * 50);

  const drop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const b = boardRef.current;
    if (isValid(b, p, 0, 1)) {
      setPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      const newBoard = placePiece(b, p);
      const { board: cleared, lines: clearedLines } = clearLines(newBoard);
      const next = randomPiece();
      if (!isValid(cleared, next)) {
        setGameOver(true);
        gameOverRef.current = true;
        setBoard(cleared);
        return;
      }
      setBoard(cleared);
      setLines(l => l + clearedLines);
      setScore(s => s + clearedLines * 100 + 10);
      setPiece(next);
    }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(drop, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [drop, speed, paused]);

  const moveLeft  = () => { if (isValid(boardRef.current, pieceRef.current, -1)) setPiece(p => ({ ...p, x: p.x - 1 })); };
  const moveRight = () => { if (isValid(boardRef.current, pieceRef.current, 1))  setPiece(p => ({ ...p, x: p.x + 1 })); };
  const hardDrop  = () => {
    let dy = 0;
    while (isValid(boardRef.current, pieceRef.current, 0, dy + 1)) dy++;
    setPiece(p => ({ ...p, y: p.y + dy }));
    setTimeout(drop, 50);
  };
  const rotate = () => {
    const rotated = rotatePiece(pieceRef.current.shape);
    if (isValid(boardRef.current, pieceRef.current, 0, 0, rotated)) {
      setPiece(p => ({ ...p, shape: rotated }));
    }
  };

  const restart = () => {
    setBoard(emptyBoard());
    setPiece(randomPiece());
    setScore(0);
    setLines(0);
    setGameOver(false);
    gameOverRef.current = false;
  };

  const displayBoard = board.map(row => [...row]);
  if (!gameOver) {
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell && piece.y + r >= 0 && piece.y + r < ROWS && piece.x + c >= 0 && piece.x + c < COLS) {
          displayBoard[piece.y + r][piece.x + c] = piece.color;
        }
      });
    });
  }

  return (
    <View style={[gStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#060912', '#080C14', '#0A0F1C']} style={StyleSheet.absoluteFill} />

      <View style={gStyles.header}>
        <TouchableOpacity onPress={onExit} style={gStyles.exitBtn} activeOpacity={0.8}>
          <Text style={gStyles.exitText}>✕</Text>
        </TouchableOpacity>
        <View style={gStyles.headerCenter}>
          <Text style={gStyles.gameTitle}>BLOCOS</Text>
        </View>
        <TouchableOpacity onPress={() => setPaused(p => !p)} style={gStyles.exitBtn} activeOpacity={0.8}>
          <Text style={gStyles.exitText}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      </View>

      <View style={gStyles.boardWrapper}>
        <View style={gStyles.scoreOverlay}>
          <Text style={gStyles.scoreOverlayText}>pts {score}  |  linhas {lines}</Text>
        </View>
        <View style={[gStyles.board, { width: COLS * CELL, height: ROWS * CELL }]}>
          {displayBoard.map((row, r) =>
            row.map((cell, c) => (
              <View
                key={`${r}-${c}`}
                style={[
                  gStyles.cell,
                  { width: CELL, height: CELL, left: c * CELL, top: r * CELL },
                  cell ? { backgroundColor: cell, borderColor: cell + '60' } : gStyles.cellEmpty,
                ]}
              />
            ))
          )}
        </View>

        {gameOver && (
          <View style={gStyles.overlay}>
            <Text style={gStyles.overlayTitle}>FIM DE JOGO</Text>
            <Text style={gStyles.overlayScore}>{score} pts</Text>
            <TouchableOpacity style={gStyles.overlayBtn} onPress={restart} activeOpacity={0.8}>
              <Text style={gStyles.overlayBtnText}>Jogar de novo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={gStyles.overlayBtnSecondary} onPress={onExit} activeOpacity={0.8}>
              <Text style={gStyles.overlayBtnSecondaryText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {paused && !gameOver && (
          <View style={gStyles.overlay}>
            <Text style={gStyles.overlayTitle}>PAUSADO</Text>
            <TouchableOpacity style={gStyles.overlayBtn} onPress={() => setPaused(false)} activeOpacity={0.8}>
              <Text style={gStyles.overlayBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[gStyles.controls, { paddingBottom: insets.bottom + 8 }]}>
        <View style={gStyles.controlsRow}>
          <TouchableOpacity style={gStyles.ctrlBtn} onPress={moveLeft} activeOpacity={0.7}>
            <Text style={gStyles.ctrlIcon}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={gStyles.ctrlBtn} onPress={rotate} activeOpacity={0.7}>
            <Text style={gStyles.ctrlIcon}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[gStyles.ctrlBtn, gStyles.ctrlBtnDrop]} onPress={hardDrop} activeOpacity={0.7}>
            <LinearGradient colors={['#3D54D9', '#293CA6']} style={gStyles.ctrlBtnDropGradient}>
              <Text style={gStyles.ctrlIcon}>▼</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={gStyles.ctrlBtn} onPress={moveRight} activeOpacity={0.7}>
            <Text style={gStyles.ctrlIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOGO 2: RESPIRAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: 'INSPIRE',  duration: 4000, color: '#3D54D9', scale: 1.4 },
  { label: 'SEGURE',   duration: 7000, color: '#4A9C52', scale: 1.4 },
  { label: 'EXPIRE',   duration: 8000, color: '#F27A5E', scale: 0.7 },
];

function BreathingGame({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<number>(0);
  const [cycles, setCycles] = useState<number>(0);
  const [active, setActive] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const phaseRef = useRef<number>(0);
  const cyclesRef = useRef<number>(0);
  const activeRef = useRef<boolean>(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const runPhase = useCallback((p: number) => {
    if (!activeRef.current) return;
    const current = BREATH_PHASES[p];

    animRef.current = Animated.parallel([
      Animated.timing(scaleAnim, { toValue: current.scale, duration: current.duration, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: p === 1 ? 1 : 0.6, duration: current.duration, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: p === 0 ? 1 : 0, duration: current.duration, useNativeDriver: false }),
    ]);

    animRef.current.start(({ finished }) => {
      if (!finished || !activeRef.current) return;
      const next = (p + 1) % BREATH_PHASES.length;
      if (next === 0) { cyclesRef.current += 1; setCycles(cyclesRef.current); }
      phaseRef.current = next;
      setPhase(next);
      runPhase(next);
    });
  }, []);

  const start = () => {
    activeRef.current = true;
    setActive(true);
    phaseRef.current = 0;
    setPhase(0);
    cyclesRef.current = 0;
    setCycles(0);
    runPhase(0);
  };

  const stop = () => {
    activeRef.current = false;
    setActive(false);
    animRef.current?.stop();
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.6);
    glowAnim.setValue(0);
  };

  useEffect(() => () => { activeRef.current = false; animRef.current?.stop(); }, []);

  const currentPhase = BREATH_PHASES[phase];
  const seconds = Math.round(currentPhase.duration / 1000);

  return (
    <View style={[bStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#040810', '#060A14', '#080C18']} style={StyleSheet.absoluteFill} />

      <View style={gStyles.header}>
        <TouchableOpacity onPress={onExit} style={gStyles.exitBtn} activeOpacity={0.8}>
          <Text style={gStyles.exitText}>✕</Text>
        </TouchableOpacity>
        <View style={gStyles.headerCenter}>
          <Text style={gStyles.gameTitle}>RESPIRAÇÃO</Text>
          <Text style={gStyles.gameSubtitle}>4 — 7 — 8</Text>
        </View>
        <View style={gStyles.exitBtn} />
      </View>

      <View style={bStyles.cyclesRow}>
        <Text style={bStyles.cyclesLabel}>CICLOS COMPLETOS</Text>
        <Text style={bStyles.cyclesValue}>{cycles}</Text>
      </View>

      <View style={bStyles.bubbleContainer}>
        <Animated.View style={[
          bStyles.glow,
          {
            backgroundColor: currentPhase.color + '15',
            transform: [{ scale: Animated.multiply(scaleAnim, new Animated.Value(1.3)) }],
          }
        ]} />
        <Animated.View style={[
          bStyles.bubble,
          {
            backgroundColor: currentPhase.color + '20',
            borderColor: currentPhase.color,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          <Text style={[bStyles.phaseLabel, { color: currentPhase.color }]}>
            {active ? currentPhase.label : 'PRONTO?'}
          </Text>
          {active && <Text style={bStyles.phaseSeconds}>{seconds}s</Text>}
        </Animated.View>
      </View>

      <View style={bStyles.instructionBox}>
        <Text style={bStyles.instructionText}>
          {active
            ? phase === 0 ? 'Inspire pelo nariz lentamente...'
            : phase === 1 ? 'Segure o ar nos pulmões...'
            : 'Expire pela boca com som suave...'
            : 'Técnica 4-7-8: inspire 4s, segure 7s, expire 8s.\nReduz ansiedade em menos de 2 minutos.'}
        </Text>
      </View>

      <View style={[bStyles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={bStyles.startBtn} onPress={active ? stop : start} activeOpacity={0.85}>
          <LinearGradient
            colors={active ? ['#C0392B', '#922B21'] : ['#3D54D9', '#293CA6']}
            style={bStyles.startBtnGradient}
          >
            <Text style={bStyles.startBtnText}>{active ? '⏹  Parar' : '▶  Começar'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TELA PRINCIPAL — PanicButtonScreen
// ─────────────────────────────────────────────────────────────────────────────

type GameScreen = null | 'blocos' | 'breathing';

const GAMES = [
  {
    id: 'blocos' as GameScreen,
    title: 'BLOCOS',
    subtitle: 'Comprovado contra cravings',
    description: 'Estudos mostram que 3 min de Blocos reduzem o craving em até 70%.',
    emoji: '🎮',
    accent: '#3D54D9',
    gradient: ['#1A2A6A', '#0F1840'] as [string, string],
    badge: 'CIÊNCIA',
    badgeColor: '#3D54D9',
  },
  {
    id: 'breathing' as GameScreen,
    title: 'RESPIRAÇÃO',
    subtitle: 'Ativa o modo calma em 60s',
    description: 'Técnica 4-7-8 usada por atletas de elite para controle emocional.',
    emoji: '🌬️',
    accent: '#4A9C52',
    gradient: ['#1A3A2A', '#0F2018'] as [string, string],
    badge: 'RELAXAR',
    badgeColor: '#4A9C52',
  },
];

interface ThinkingAction {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  color: string;
  gradient: [string, string];
  tappable: boolean;
}

const THINKING_ACTIONS: ThinkingAction[] = [
  {
    id: 'blocos',
    emoji: '🎮',
    title: 'Jogar Blocos',
    desc: '3 minutos reduzem o impulso em até 70%.',
    color: '#3D54D9',
    gradient: ['#1A2A6A', '#0F1840'],
    tappable: true,
  },
  {
    id: 'breath',
    emoji: '🌬️',
    title: 'Respirar 4-7-8',
    desc: 'Ativa o modo calma em 60 segundos.',
    color: '#4A9C52',
    gradient: ['#1A3A2A', '#0F2018'],
    tappable: true,
  },
  {
    id: 'move',
    emoji: '🚶',
    title: 'Sair do ambiente',
    desc: 'Vá para outro cômodo ou tome água gelada.',
    color: '#6B7FE8',
    gradient: ['#1A2050', '#0F1430'],
    tappable: false,
  },
  {
    id: 'contact',
    emoji: '💬',
    title: 'Falar com alguém',
    desc: 'Manda uma mensagem pra um amigo agora.',
    color: '#4A8A7A',
    gradient: ['#0F2520', '#0A1A16'],
    tappable: false,
  },
];

export default function PanicButtonScreen({ onClose, onRelapsed }: Props) {
  const insets = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isProcessing = useRef<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'games' | 'motivation'>('games');
  const [activeGame, setActiveGame] = useState<GameScreen>(null);
  const [showRelapsed, setShowRelapsed] = useState<boolean>(false);
  const [showThinking, setShowThinking] = useState<boolean>(false);
const [showCamera, setShowCamera] = useState<boolean>(false);


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Jogo em tela cheia ────────────────────────────────────────────────────
  if (activeGame === 'blocos') {
    return <BlocosGame onExit={onClose} />;
  }
  if (activeGame === 'breathing') {
    return <BreathingGame onExit={onClose} />;
  }

  // ── Tela de recaída ───────────────────────────────────────────────────────
  if (showRelapsed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#080C14', '#0A0F1A', '#060A12']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowRelapsed(false)} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerSub, { color: '#F27A5E' }]}>Recaída</Text>
          </View>
          <View style={styles.headerBtn} />
        </View>

        {/* Conteúdo */}
        <ScrollView
          contentContainerStyle={styles.relapsedContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.relapsedTitle}>Não se preocupe com isso.</Text>
          <Text style={styles.relapsedSubtitle}>
            Deslizes acontecem e podem te fazer sentir mal, mas é essencial não ser muito duro consigo mesmo. Você está cada vez mais perto da liberdade.
          </Text>

          <Text style={styles.relapsedQuote}>
            A disciplina em resistir{'\n'}leva a uma versão{'\n'}mais forte de você.
          </Text>

          <Text style={styles.relapsedTeam}>
            Você consegue. O time ZEREI acredita em você 💙
          </Text>
        </ScrollView>

        {/* Botão resetar */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.btnResetCounter}
            activeOpacity={0.85}
            onPress={onRelapsed}
          >
            <LinearGradient colors={['#F27A5E', '#D05030']} style={styles.btnResetCounterGradient}>
              <Text style={styles.btnResetCounterText}>↺  Resetar Contador</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Tela: pensando em recair ──────────────────────────────────────────────
  if (showThinking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#080C14', '#0A0F1A', '#060A12']} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowThinking(false)} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerSub, { color: '#6B7FE8' }]}>Segura aí</Text>
          </View>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.thinkingContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.thinkingImpactBlock}>
            <Text style={styles.thinkingImpactText}>
              Esse momento{'\n'}vai passar.
            </Text>
            <Text style={styles.thinkingSubText}>
              Um impulso dura em média 15 a 20 minutos. Você não precisa agir — só precisa esperar.
            </Text>
          </View>

          <View style={styles.thinkingDurationCard}>
            <View style={styles.thinkingDurationBar}>
              <View style={styles.thinkingDurationFill} />
            </View>
            <Text style={styles.thinkingDurationLabel}>A onda do impulso já está passando</Text>
          </View>

          <Text style={styles.thinkingActionsTitle}>Faça uma dessas agora:</Text>

          {THINKING_ACTIONS.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.thinkingActionCard}
              activeOpacity={0.75}
              onPress={() => {
                if (action.id === 'blocos') { setShowThinking(false); setActiveGame('blocos'); }
                else if (action.id === 'breath') { setShowThinking(false); setActiveGame('breathing'); }
              }}
            >
              <LinearGradient
                colors={action.gradient as [string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.thinkingActionBorder, { borderColor: action.color + '40' }]} />
              <Text style={styles.thinkingActionEmoji}>{action.emoji}</Text>
              <View style={styles.thinkingActionText}>
                <Text style={[styles.thinkingActionTitle, { color: action.color }]}>{action.title}</Text>
                <Text style={styles.thinkingActionDesc}>{action.desc}</Text>
              </View>
              {action.tappable && (
                <Ionicons name="chevron-forward" size={16} color={action.color} style={{ opacity: 0.7 }} />
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.thinkingClosingBlock}>
            <Text style={styles.thinkingClosingQuote}>
              "Resistir uma vez{'\n'}é provar pra você mesmo{'\n'}que você consegue."
            </Text>
            <Text style={styles.thinkingClosingTeam}>O time ZEREI está com você 💙</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.btnThinkingBack}
            activeOpacity={0.85}
            onPress={() => setShowThinking(false)}
          >
            <LinearGradient colors={['#3D54D9', '#293CA6']} style={styles.btnThinkingBackGradient}>
              <Text style={styles.btnThinkingBackText}>✓  Consegui resistir</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Tela principal ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onClose();
          }}
          style={styles.headerBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerLogo}>ZEREI</Text>
          <Text style={styles.headerSub}>Botão de Pânico</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Informações"
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            setShowTooltip(true);
          }}
        >
          <Ionicons name="information-circle-outline" size={22} color="#4A5A8A" />
        </TouchableOpacity>

        {showTooltip && (
          <TouchableOpacity
            style={styles.tooltipOverlay}
            activeOpacity={1}
            onPress={() => setShowTooltip(false)}
          >
            <View style={styles.tooltip}>
              <Text style={styles.tooltipTitle}>Botão de Pânico</Text>
              <Text style={styles.tooltipText}>
                Quando o impulso bater, abra essa tela. Jogue por alguns minutos ou veja os efeitos de uma recaída — seu cérebro precisa de um substituto agora.
              </Text>
              <TouchableOpacity onPress={() => setShowTooltip(false)} activeOpacity={0.8}>
                <Text style={styles.tooltipClose}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.tabActive]}
          onPress={() => setActiveTab('games')}
          activeOpacity={0.8}
        >
          {activeTab === 'games' && (
            <LinearGradient
              colors={['#3D54D9', '#293CA6']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>
            🎮  Jogos
          </Text>
          {activeTab === 'games' && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>NOVO</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'motivation' && styles.tabActiveAlt]}
          onPress={() => setActiveTab('motivation')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'motivation' && styles.tabTextActive]}>
            💪  Motivação
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ABA JOGOS ── */}
        {activeTab === 'games' && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            <View style={styles.urgencyBlock}>
              <Text style={styles.urgencyTitle}>Seu cérebro precisa{'\n'}de dopamina agora.</Text>
              <Text style={styles.urgencySubtitle}>
                Dê a ele. Mas de uma fonte que não vai te destruir.
              </Text>
            </View>

            {GAMES.map((game, i) => (
              <Animated.View
                key={game.id}
                style={[
                  styles.gameCardWrapper,
                  i === 0 && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setActiveGame(game.id)}
                  style={styles.gameCard}
                >
                  <LinearGradient
                    colors={game.gradient}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={[styles.gameCardBorder, { borderColor: game.accent + '50' }]} />

                  <View style={styles.gameCardTop}>
                    <View>
                      <View style={[styles.gameBadge, { backgroundColor: game.badgeColor + '25', borderColor: game.badgeColor + '50' }]}>
                        <Text style={[styles.gameBadgeText, { color: game.badgeColor }]}>{game.badge}</Text>
                      </View>
                      <Text style={styles.gameCardTitle}>{game.title}</Text>
                      <Text style={[styles.gameCardSubtitle, { color: game.accent }]}>{game.subtitle}</Text>
                    </View>
                    <Text style={styles.gameEmoji}>{game.emoji}</Text>
                  </View>

                  <Text style={styles.gameCardDesc}>{game.description}</Text>

                  <View style={[styles.gamePlayBtn, { backgroundColor: game.accent }]}>
                    <Text style={styles.gamePlayBtnText}>Jogar agora →</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}

            <View style={styles.scienceNote}>
              <Text style={styles.scienceNoteText}>
                🔬 Pesquisa da Universidade de Plymouth (2015) comprovou que jogos de blocos reduzem cravings em até 70% em apenas 3 minutos.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── ABA MOTIVAÇÃO ── */}
        {activeTab === 'motivation' && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.mottoBlock}>
              <Text style={styles.motto}>
                NÃO DÊ ESSE{'\n'}PODER SOBRE{'\n'}A SUA VIDA.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Efeitos de uma recaída:</Text>

            <View style={styles.effectsCard}>
              {EFEITOS.map((efeito, index) => (
                <View key={index}>
                  <View style={styles.effectRow}>
                    <View style={styles.effectIcon}>
                      <efeito.Icon />
                    </View>
                    <View style={styles.effectText}>
                      <Text style={styles.effectTitulo}>{efeito.titulo}</Text>
                      <Text style={styles.effectDescricao}>{efeito.descricao}</Text>
                    </View>
                  </View>
                  {index < EFEITOS.length - 1 && <View style={styles.effectDivider} />}
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer fixo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.btnRelapsed}
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            setShowRelapsed(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="thumbs-down-outline" size={18} color="#F27A5E" style={{ marginRight: 8 }} />
          <Text style={styles.btnRelapsedText}>Eu recaí</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.btnThinking}
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);

    // Vibração padrão de ligação — 5 pulsos fortes com intervalo
    let count = 0;
    const pulsos = setInterval(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      count++;
      if (count >= 5) clearInterval(pulsos);
    }, 180);

    setShowThinking(true);
  }}
  activeOpacity={0.8}
>
  <Ionicons name="warning-outline" size={18} color="#E0EAFF" style={{ marginRight: 8 }} />
  <Text style={styles.btnThinkingText}>Estou pensando em recair</Text>
</TouchableOpacity>
      </View>

      {showCamera && (
  <View style={styles.cameraModal}>
    <View style={styles.cameraOverlay}>
      <Text style={styles.cameraFrase}>Olha pra você.</Text>
      <Text style={styles.cameraSubfrase}>
        Essa pessoa merece mais do que um momento de fraqueza.
      </Text>
    </View>
    <TouchableOpacity
      style={styles.cameraDismiss}
      onPress={() => { setShowCamera(false); setShowThinking(true); }}
      activeOpacity={0.85}
    >
      <Text style={styles.cameraDismissText}>Continuar →</Text>
    </TouchableOpacity>
  </View>
)}
    </View>
  );
}


// ─── Estilos — Jogos ──────────────────────────────────────────────────────────

const gStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060912' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  exitBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  exitText: { fontSize: 18, color: 'rgba(255,255,255,0.5)', fontFamily: 'Rubik_500Medium' },
  headerCenter: { alignItems: 'center', gap: 2 },
  gameTitle: { fontFamily: 'Rubik_700Bold', fontSize: 18, color: '#E0EAFF', letterSpacing: 3 },
  gameSubtitle: { fontFamily: 'Rubik_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  boardWrapper: { alignItems: 'center', flex: 1, position: 'relative' },
  board: { position: 'relative', borderWidth: 1, borderColor: '#1A2240', backgroundColor: '#080C14' },
  cell: { position: 'absolute', borderWidth: 1, borderRadius: 2 },
  cellEmpty: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.03)' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,9,18,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  overlayTitle: { fontFamily: 'Rubik_700Bold', fontSize: 28, color: '#E0EAFF', letterSpacing: 2 },
  overlayScore: { fontFamily: 'Rubik_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.5)' },
  overlayBtn: { backgroundColor: '#3D54D9', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  overlayBtnText: { fontFamily: 'Rubik_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  overlayBtnSecondary: { paddingVertical: 8 },
  overlayBtnSecondaryText: { fontFamily: 'Rubik_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  controls: { paddingHorizontal: 16, paddingTop: 8 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  ctrlBtn: {
    width: 72, height: 52, borderRadius: 14,
    backgroundColor: '#0F1420', borderWidth: 1, borderColor: '#1A2240',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnDrop: { overflow: 'hidden' },
  ctrlBtnDropGradient: { width: 72, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctrlIcon: { fontSize: 22, color: '#E0EAFF' },
  scoreOverlay: { position: 'absolute', top: 6, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  scoreOverlayText: { fontFamily: 'Rubik_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
});

const bStyles = StyleSheet.create({
  container: { flex: 1 },
  cyclesRow: { alignItems: 'center', paddingVertical: 8, gap: 2 },
  cyclesLabel: { fontFamily: 'Rubik_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
  cyclesValue: { fontFamily: 'Rubik_700Bold', fontSize: 36, color: '#E0EAFF', letterSpacing: -1 },
  bubbleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  bubble: { width: 180, height: 180, borderRadius: 90, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 8 },
  phaseLabel: { fontFamily: 'Rubik_700Bold', fontSize: 18, letterSpacing: 3, textAlign: 'center' },
  phaseSeconds: { fontFamily: 'Rubik_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  instructionBox: { paddingHorizontal: 40, paddingVertical: 20, alignItems: 'center' },
  instructionText: { fontFamily: 'Rubik_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24 },
  startBtn: { borderRadius: 16, overflow: 'hidden' },
  startBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontFamily: 'Rubik_700Bold', fontSize: 17, color: '#FFFFFF', letterSpacing: 1 },
});

// ─── Estilos — PanicButtonScreen ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 18, color: '#4A5A8A' },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerLogo: { fontFamily: 'Rubik_700Bold', fontSize: 18, color: '#E0EAFF', letterSpacing: 4 },
  headerSub: { fontFamily: 'Rubik_500Medium', fontSize: 13, color: '#F27A5E', letterSpacing: 0.5 },

  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 4 },
  tab: {
    flex: 1, height: 46, borderRadius: 14,
    backgroundColor: '#0F1420', borderWidth: 1, borderColor: '#1A2240',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6, overflow: 'hidden', position: 'relative',
  },
  tabActive: { borderColor: '#3D54D9' },
  tabActiveAlt: { borderColor: '#1A2240' },
  tabText: { fontFamily: 'Rubik_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: '#FFFFFF', fontFamily: 'Rubik_600SemiBold' },
  tabBadge: { backgroundColor: '#F27A5E', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
  tabBadgeText: { fontFamily: 'Rubik_700Bold', fontSize: 8, color: '#FFFFFF', letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  urgencyBlock: { marginBottom: 20, gap: 8 },
  urgencyTitle: { fontFamily: 'Rubik_700Bold', fontSize: 26, color: '#E0EAFF', lineHeight: 34, letterSpacing: -0.5 },
  urgencySubtitle: { fontFamily: 'Rubik_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 22 },

  gameCardWrapper: { marginBottom: 14 },
  gameCard: { borderRadius: 20, padding: 20, gap: 12, overflow: 'hidden', position: 'relative' },
  gameCardBorder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, borderWidth: 1 },
  gameCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  gameBadge: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  gameBadgeText: { fontFamily: 'Rubik_700Bold', fontSize: 9, letterSpacing: 1.5 },
  gameCardTitle: { fontFamily: 'Rubik_700Bold', fontSize: 24, color: '#E0EAFF', letterSpacing: 1 },
  gameCardSubtitle: { fontFamily: 'Rubik_500Medium', fontSize: 13, marginTop: 2 },
  gameEmoji: { fontSize: 48, lineHeight: 56 },
  gameCardDesc: { fontFamily: 'Rubik_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 21 },
  gamePlayBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  gamePlayBtnText: { fontFamily: 'Rubik_600SemiBold', fontSize: 15, color: '#FFFFFF' },

  scienceNote: {
    backgroundColor: 'rgba(61,84,217,0.08)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(61,84,217,0.2)', marginBottom: 8,
  },
  scienceNoteText: { fontFamily: 'Rubik_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  mottoBlock: { paddingVertical: 32, alignItems: 'center' },
  motto: { fontFamily: 'Rubik_700Bold', fontSize: 36, color: '#E0EAFF', textAlign: 'center', lineHeight: 44, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionLabel: { fontFamily: 'Rubik_500Medium', fontSize: 15, color: '#FFFFFF', textAlign: 'center', marginBottom: 16, letterSpacing: 0.3 },
  effectsCard: { backgroundColor: '#0F1420', borderRadius: 20, borderWidth: 1, borderColor: '#1A2240', paddingVertical: 8, paddingHorizontal: 20 },
  effectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  effectIcon: { width: 36, alignItems: 'center', justifyContent: 'center' },
  effectText: { flex: 1, gap: 3 },
  effectTitulo: { fontFamily: 'Rubik_600SemiBold', fontSize: 13, color: '#E0EAFF', letterSpacing: 1 },
  effectDescricao: { fontFamily: 'Rubik_400Regular', fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  effectDivider: { height: 1, backgroundColor: '#1A2240' },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    backgroundColor: '#080C14',
    borderTopWidth: 1,
    borderTopColor: '#1A2240',
  },
  btnRelapsed: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 28, borderWidth: 1.5,
    borderColor: '#F27A5E', backgroundColor: 'rgba(242,122,94,0.06)',
  },
  btnRelapsedText: { fontFamily: 'Rubik_600SemiBold', fontSize: 16, color: '#F27A5E' },
  btnThinking: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 28, backgroundColor: '#F27A5E',
  },
  btnThinkingText: { fontFamily: 'Rubik_600SemiBold', fontSize: 16, color: '#E0EAFF' },

  tooltipOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 32, zIndex: 100,
  },
  tooltip: { backgroundColor: '#0F1420', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1A2240', gap: 12 },
  tooltipTitle: { fontFamily: 'Rubik_700Bold', fontSize: 16, color: '#E0EAFF' },
  tooltipText: { fontFamily: 'Rubik_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  tooltipClose: { fontFamily: 'Rubik_600SemiBold', fontSize: 14, color: '#3D54D9', textAlign: 'right', marginTop: 4 },

  // Tela de recaída
  relapsedContent: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 160,
    alignItems: 'center',
  },
  relapsedTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 30,
    color: '#E0EAFF',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
  },
  relapsedSubtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  relapsedQuote: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 32,
  },
  relapsedTeam: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#3D54D9',
    textAlign: 'center',
  },
  btnResetCounter: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  btnResetCounterGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnResetCounterText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Tela: pensando em recair ──────────────────────────────────────────────
  thinkingContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 160,
    gap: 20,
  },
  thinkingImpactBlock: {
    gap: 12,
    paddingBottom: 4,
  },
  thinkingImpactText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: '#E0EAFF',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  thinkingSubText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 24,
  },
  thinkingDurationCard: {
    backgroundColor: '#0F1420',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A2240',
    padding: 16,
    gap: 10,
  },
  thinkingDurationBar: {
    height: 6,
    backgroundColor: '#1A2240',
    borderRadius: 3,
    overflow: 'hidden',
  },
  thinkingDurationFill: {
    width: '40%',
    height: '100%',
    backgroundColor: '#3D54D9',
    borderRadius: 3,
  },
  thinkingDurationLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  thinkingActionsTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: -8,
  },
  thinkingActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  thinkingActionBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
  },
  thinkingActionEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  thinkingActionText: {
    flex: 1,
    gap: 3,
  },
  thinkingActionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 15,
  },
  thinkingActionDesc: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  thinkingClosingBlock: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  thinkingClosingQuote: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#E0EAFF',
    textAlign: 'center',
    lineHeight: 30,
  },
  thinkingClosingTeam: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#3D54D9',
    textAlign: 'center',
  },
  btnThinkingBack: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  btnThinkingBackGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnThinkingBackText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cameraModal: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    zIndex: 999,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: 'rgba(8,12,20,0.5)',
    paddingBottom: 32,
  },
  cameraFrase: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 34,
    color: '#E0EAFF',
    lineHeight: 42,
  },
  cameraSubfrase: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  cameraDismiss: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    backgroundColor: '#3D54D9',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cameraDismissText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});