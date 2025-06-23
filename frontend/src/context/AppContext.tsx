'use client';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Item, PersonAssignment, PersonSplitResult, ParsedData } from '../types';

type AppAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_PARSED_DATA'; payload: ParsedData }
  | { type: 'SET_ITEMS'; payload: Item[] }
  | { type: 'ADD_PERSON'; payload: string }
  | { type: 'REMOVE_PERSON'; payload: string }
  | { type: 'SET_ASSIGNMENTS'; payload: PersonAssignment[] }
  | { type: 'SET_SPLIT_RESULTS'; payload: PersonSplitResult[] }
  | { type: 'RESET' };

const initialState: AppState = {
  currentStep: 1,
  sessionId: '',
  parsedData: null,
  items: [],
  people: [],
  assignments: [],
  splitResults: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_PARSED_DATA':
      return { 
        ...state, 
        parsedData: action.payload,
        items: action.payload.items,
        sessionId: Date.now().toString()
      };
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'ADD_PERSON':
      if (state.people.includes(action.payload)) return state;
      return { 
        ...state, 
        people: [...state.people, action.payload],
        assignments: [...state.assignments, { name: action.payload, items: [] }]
      };
    case 'REMOVE_PERSON':
      return { 
        ...state, 
        people: state.people.filter(p => p !== action.payload),
        assignments: state.assignments.filter(a => a.name !== action.payload)
      };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload };
    case 'SET_SPLIT_RESULTS':
      return { ...state, splitResults: action.payload };
    case 'RESET':
      return { ...initialState, sessionId: Date.now().toString() };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}