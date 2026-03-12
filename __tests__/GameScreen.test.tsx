import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import GameScreen from '../app/(tabs)/index';
import { useGameStore } from '../store/useGameStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Sound
jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn().mockImplementation(() => ({
      loadAsync: jest.fn(),
      playAsync: jest.fn(),
      unloadAsync: jest.fn(),
    })),
  },
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Keep Awake
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(null),
  deactivateKeepAwake: jest.fn(),
}));

// Mock Safe Area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    PanGestureHandler: View,
    State: {
      BEGAN: 'BEGAN',
      FAILED: 'FAILED',
      ACTIVE: 'ACTIVE',
      END: 'END',
      UNDETERMINED: 'UNDETERMINED',
    },
  };
});

describe('GameScreen', () => {
  beforeEach(() => {
    act(() => {
      useGameStore.setState({
        currentPhase: 'LANG_SELECT',
        players: [],
        gamePlayers: [],
        language: 'en',
      });
    });
  });

  it('renders language selection initially', () => {
    const { getByText } = render(<GameScreen />);
    expect(getByText('EN')).toBeTruthy();
    expect(getByText('ES')).toBeTruthy();
  });

  it('transitions to mode selection after choosing language', () => {
    const { getByText } = render(<GameScreen />);
    fireEvent.press(getByText('EN'));
    
    expect(useGameStore.getState().currentPhase).toBe('MODE_SELECT');
    expect(getByText('SELECT MODE')).toBeTruthy();
  });

  it('transitions to player setup after choosing mode', () => {
    act(() => {
      useGameStore.setState({ currentPhase: 'MODE_SELECT', language: 'en' });
    });
    const { getByText } = render(<GameScreen />);
    
    fireEvent.press(getByText('ADULTS'));
    
    expect(useGameStore.getState().currentPhase).toBe('PLAYER_SETUP');
  });

  it('allows adding and removing players', () => {
    act(() => {
      useGameStore.setState({ currentPhase: 'PLAYER_SETUP', language: 'en' });
    });
    const { getByPlaceholderText, getByText, queryByText } = render(<GameScreen />);
    
    const input = getByPlaceholderText('Player Name');
    fireEvent.changeText(input, 'Alice');
    fireEvent.press(getByText('+'));
    
    expect(getByText('Alice')).toBeTruthy();
    
    const removeBtn = getByText('✕');
    fireEvent.press(removeBtn);
    
    expect(queryByText('Alice')).toBeNull();
  });

  it('shows start button only when 3 or more players are added', () => {
    act(() => {
      useGameStore.setState({ currentPhase: 'PLAYER_SETUP', language: 'en', players: ['Alice', 'Bob'] });
    });
    const { queryByText, rerender } = render(<GameScreen />);
    
    expect(queryByText('START GAME')).toBeNull();
    
    act(() => {
      useGameStore.setState({ players: ['Alice', 'Bob', 'Charlie'] });
    });
    rerender(<GameScreen />);
    
    expect(queryByText('START GAME')).toBeTruthy();
  });
});
