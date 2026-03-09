import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'CIVILIAN' | 'IMPOSTOR';

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
  gamesPlayed: number;
  currentPhase: 'SETUP' | 'REVEAL' | 'LOBBY' | 'VOTING_CHOICE' | 'VOTING_SECRET' | 'VOTING_AGREEMENT' | 'RESULT';
  currentPlayerIndex: number;
  startingPlayerIndex: number;
  votes: Record<string, string>; // voterId -> suspectId
  impostorsCount: number;
  isChaosMode: boolean;
  voteAttempt: number; // 1 or 2
  
  // Actions
  setLanguage: (lang: 'en' | 'es' | 'ca' | 'nl') => void;
  addPlayer: (name: string) => void;
  removePlayer: (index: number) => void;
  startGame: (wordData: any) => void;
  nextReveal: () => void;
  chooseVotingMethod: (method: 'SECRET' | 'AGREEMENT') => void;
  submitVote: (voterId: string, suspectId: string) => void;
  submitAgreement: (suspectId: string) => void;
  tryAgain: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [],
      gamePlayers: [],
      language: 'es',
      gamesPlayed: 0,
      currentPhase: 'SETUP',
      currentPlayerIndex: 0,
      startingPlayerIndex: 0,
      votes: {},
      impostorsCount: 1,
      isChaosMode: false,
      voteAttempt: 1,

      setLanguage: (lang) => set({ language: lang }),
      
      addPlayer: (name) => set((state) => ({ players: [...state.players, name] })),
      
      removePlayer: (index) => set((state) => ({
        players: state.players.filter((_, i) => i !== index)
      })),

      startGame: (wordData) => {
        const { players, gamesPlayed } = get();
        if (players.length < 3) return;

        const newGamesPlayed = gamesPlayed + 1;
        let impostorsCount = players.length >= 7 ? 2 : 1;
        
        // Bug 1: +1 Impostor
        if (newGamesPlayed >= 3 && Math.random() < 0.3) {
          impostorsCount += 1;
        }

        // Bug 2: Chaos Mode (All Impostors)
        let isChaosMode = false;
        if (newGamesPlayed >= 5 && Math.random() < 0.2) {
          isChaosMode = true;
          impostorsCount = players.length;
        }

        const playerNames = [...players];
        const shuffledIndices = Array.from({ length: playerNames.length }, (_, i) => i)
          .sort(() => Math.random() - 0.5);

        const impostorIndices = shuffledIndices.slice(0, impostorsCount);
        
        const words = Object.keys(wordData);
        const secretWord = words[Math.floor(Math.random() * words.length)];
        const data = wordData[secretWord];
        
        const sameClueForAllChaos = Math.random() < 0.5;
        const sharedClue = data.clues[Math.floor(Math.random() * data.clues.length)];

        const gamePlayers: Player[] = playerNames.map((name, index) => {
          const isImpostor = isChaosMode || impostorIndices.includes(index);
          const role: Role = isImpostor ? 'IMPOSTOR' : 'CIVILIAN';
          let secret = secretWord;

          if (isImpostor) {
            if (isChaosMode && !sameClueForAllChaos) {
              secret = data.clues[Math.floor(Math.random() * data.clues.length)];
            } else {
              secret = sharedClue;
            }
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
          voteAttempt: 1
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

      submitVote: (voterId, suspectId) => {
        set((state) => {
          const newVotes = { ...state.votes, [voterId]: suspectId };
          const isLastVote = Object.keys(newVotes).length === state.gamePlayers.length;
          
          return {
            votes: newVotes,
            currentPhase: isLastVote ? 'RESULT' : 'VOTING_SECRET',
            currentPlayerIndex: isLastVote ? 0 : state.currentPlayerIndex + 1
          };
        });
      },

      submitAgreement: (suspectId) => {
        set((state) => ({
          votes: { 'agreement': suspectId },
          currentPhase: 'RESULT'
        }));
      },

      tryAgain: () => {
        set((state) => ({
          currentPhase: 'LOBBY',
          voteAttempt: 2,
          votes: {}
        }));
      },

      resetGame: () => set({ currentPhase: 'SETUP', gamePlayers: [], votes: {}, voteAttempt: 1 })
    }),
    {
      name: 'impostor-game-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
