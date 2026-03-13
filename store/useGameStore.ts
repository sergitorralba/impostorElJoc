import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'CIVILIAN' | 'IMPOSTOR';
export type GameMode = 'STANDARD' | 'KIDS';

export interface Player {
  id: string;
  name: string;
  role: Role;
  secret: string;
}

interface GameState {
  players: string[]; // Names entered in SETUP
  gamePlayers: Player[];
  language: 'en' | 'es' | 'ca' | 'nl';
  gameMode: GameMode;
  selectedTheme: string;
  gamesPlayed: number;
  currentPhase: 'LANG_SELECT' | 'MODE_SELECT' | 'THEME_SELECT' | 'PLAYER_SETUP' | 'REVEAL' | 'LOBBY' | 'VOTING_CHOICE' | 'VOTING_SECRET' | 'VOTING_AGREEMENT' | 'RESULT';
  currentPlayerIndex: number;
  startingPlayerIndex: number;
  votes: Record<string, string[]>; // voterId -> suspectIds
  impostorsCount: number;
  isChaosMode: boolean;
  
  // Actions
  setLanguage: (lang: 'en' | 'es' | 'ca' | 'nl') => void;
  setGameMode: (mode: GameMode) => void;
  setTheme: (theme: string) => void;
  addPlayer: (name: string) => void;
  removePlayer: (index: number) => void;
  startGame: (wordData: any) => void;
  nextReveal: () => void;
  chooseVotingMethod: (method: 'SECRET' | 'AGREEMENT') => void;
  submitVote: (voterId: string, suspectIds: string[]) => void;
  submitAgreement: (suspectIds: string[]) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [],
      gamePlayers: [],
      language: 'ca',
      gameMode: 'STANDARD',
      selectedTheme: 'ALL',
      gamesPlayed: 0,
      currentPhase: 'LANG_SELECT',
      currentPlayerIndex: 0,
      startingPlayerIndex: 0,
      votes: {},
      impostorsCount: 1,
      isChaosMode: false,

      setLanguage: (lang) => set({ language: lang, currentPhase: 'MODE_SELECT' }),
      
      setGameMode: (mode) => set({ gameMode: mode, currentPhase: 'THEME_SELECT' }),

      setTheme: (theme) => set({ selectedTheme: theme, currentPhase: 'PLAYER_SETUP' }),
      
      addPlayer: (name) => set((state) => ({ players: [...state.players, name] })),
      
      removePlayer: (index) => set((state) => ({
        players: state.players.filter((_, i) => i !== index)
      })),

      startGame: (wordData) => {
        const { players, gamesPlayed, gameMode, selectedTheme } = get();
        if (players.length < 3) return;

        const newGamesPlayed = gamesPlayed + 1;
        let impostorsCount = players.length >= 7 ? 2 : 1;
        let isChaosMode = false;
        
        // Bug logic: After 5 consecutive games
        if (gamesPlayed >= 5) {
          const rand = Math.random();
          if (rand < 0.2) {
            // 20% probability of a "Bug"
            const bugType = Math.random();
            if (bugType < 0.4) {
              // Chaos Mode: All Impostors
              isChaosMode = true;
              impostorsCount = players.length;
            } else {
              // Extra Impostor(s)
              const extra = Math.floor(Math.random() * 2) + 1; // 1 or 2 extra
              impostorsCount = Math.min(impostorsCount + extra, players.length);
            }
          }
        }

        const playerNames = [...players];
        const shuffledIndices = Array.from({ length: playerNames.length }, (_, i) => i)
          .sort(() => Math.random() - 0.5);

        const impostorIndices = shuffledIndices.slice(0, impostorsCount);
        
        const allWords = Object.entries(wordData);
        let wordPool = allWords.filter(([_, value]: any) => 
          gameMode === 'KIDS' ? value.kidsMode === true : true
        );

        if (selectedTheme !== 'ALL') {
          wordPool = wordPool.filter(([_, value]: any) => value.category === selectedTheme);
        }
        
        if (wordPool.length === 0) wordPool = allWords; // Fallback

        const [secretWord, data]: [string, any] = wordPool[Math.floor(Math.random() * wordPool.length)];
        
        // Shuffle clues to give different ones to each imposter
        const shuffledClues = [...data.clues].sort(() => Math.random() - 0.5);
        let clueIndex = 0;

        const gamePlayers: Player[] = playerNames.map((name, index) => {
          const isImpostor = isChaosMode || impostorIndices.includes(index);
          const role: Role = isImpostor ? 'IMPOSTOR' : 'CIVILIAN';
          let secret = secretWord;

          if (isImpostor) {
            // Assign a different clue from the shuffled list
            secret = shuffledClues[clueIndex % shuffledClues.length];
            clueIndex++;
          }

          return { id: index.toString(), name, role, secret };
        });

        set({
          gamePlayers,
          currentPhase: 'REVEAL',
          currentPlayerIndex: 0,
          startingPlayerIndex: Math.floor(Math.random() * players.length),
          gamesPlayed: newGamesPlayed,
          impostorsCount,
          isChaosMode,
          votes: {},
        });
      },

      nextReveal: () => {
        const { currentPlayerIndex, gamePlayers } = get();
        if (currentPlayerIndex < gamePlayers.length - 1) {
          set({ currentPlayerIndex: currentPlayerIndex + 1 });
        } else {
          set({ currentPhase: 'LOBBY' });
        }
      },

      chooseVotingMethod: (method) => {
        if (method === 'SECRET') {
          set({ currentPhase: 'VOTING_SECRET', currentPlayerIndex: 0, votes: {} });
        } else {
          set({ currentPhase: 'VOTING_AGREEMENT' });
        }
      },

      submitVote: (voterId, suspectIds) => {
        set((state) => {
          const newVotes = { ...state.votes, [voterId]: suspectIds };
          const isLastVote = Object.keys(newVotes).length === state.gamePlayers.length;
          
          return {
            votes: newVotes,
            currentPhase: isLastVote ? 'RESULT' : 'VOTING_SECRET',
            currentPlayerIndex: isLastVote ? 0 : state.currentPlayerIndex + 1
          };
        });
      },

      submitAgreement: (suspectIds) => {
        set((state) => ({
          votes: { 'agreement': suspectIds },
          currentPhase: 'RESULT'
        }));
      },

      resetGame: () => set({ 
        currentPhase: 'LANG_SELECT', 
        gamePlayers: [], 
        players: [], // Reset names
        gamesPlayed: 0, // Reset consecutive games
        votes: {}, 
      })
    }),
    {
      name: 'impostor-game-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
