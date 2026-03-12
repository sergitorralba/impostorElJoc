import { useGameStore } from '../store/useGameStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      players: ['Alice', 'Bob', 'Charlie', 'Dave'],
      gamePlayers: [],
      gamesPlayed: 0,
      currentPhase: 'LANG_SELECT',
      isChaosMode: false,
    });
  });

  it('should add players correctly', () => {
    useGameStore.getState().addPlayer('Eve');
    expect(useGameStore.getState().players).toContain('Eve');
    expect(useGameStore.getState().players.length).toBe(5);
  });

  it('should remove players correctly', () => {
    useGameStore.getState().removePlayer(0); // Remove Alice
    expect(useGameStore.getState().players).not.toContain('Alice');
    expect(useGameStore.getState().players.length).toBe(3);
  });

  it('should start game and assign roles', () => {
    const mockWordData = {
      "apple": { "clues": ["fruit", "red"], "kidsMode": true }
    };
    
    useGameStore.getState().startGame(mockWordData);
    
    const { gamePlayers, currentPhase, impostorsCount } = useGameStore.getState();
    
    expect(currentPhase).toBe('REVEAL');
    expect(gamePlayers.length).toBe(4);
    
    const impostors = gamePlayers.filter(p => p.role === 'IMPOSTOR');
    const civilians = gamePlayers.filter(p => p.role === 'CIVILIAN');
    
    expect(impostors.length).toBeGreaterThanOrEqual(1);
    expect(civilians.length).toBeGreaterThanOrEqual(1);
    expect(impostors.length + civilians.length).toBe(4);
  });

  it('should respect kidsMode filtering', () => {
    const mockWordData = {
      "apple": { "clues": ["fruit"], "kidsMode": true },
      "derivative": { "clues": ["math"], "kidsMode": false }
    };
    
    useGameStore.setState({ gameMode: 'KIDS' });
    useGameStore.getState().startGame(mockWordData);
    
    const { gamePlayers } = useGameStore.getState();
    // Civilians should have the kids-friendly secret
    const civilian = gamePlayers.find(p => p.role === 'CIVILIAN');
    expect(civilian?.secret).toBe('apple');
  });

  it('should increment gamesPlayed on startGame', () => {
    const mockWordData = { "test": { "clues": ["t"], "kidsMode": true } };
    useGameStore.getState().startGame(mockWordData);
    expect(useGameStore.getState().gamesPlayed).toBe(1);
  });

  it('should handle multi-suspect voting', () => {
    const mockWordData = { "test": { "clues": ["t"], "kidsMode": true } };
    useGameStore.getState().startGame(mockWordData);
    
    // Simulate being in voting phase
    useGameStore.setState({ currentPhase: 'VOTING_SECRET', impostorsCount: 2 });
    
    const { gamePlayers } = useGameStore.getState();
    const voterId = gamePlayers[0].id;
    const suspects = [gamePlayers[1].id, gamePlayers[2].id];
    
    useGameStore.getState().submitVote(voterId, suspects);
    
    expect(useGameStore.getState().votes[voterId]).toEqual(suspects);
  });
});
