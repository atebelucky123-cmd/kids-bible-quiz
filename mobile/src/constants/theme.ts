import '@/global.css';

// Design tokens from the client-approved UI design ("Cobalt Playground") —
// the fixed brand colors used across every screen.
export const Brand = {
  cobalt: '#3a4ca0',
  lime: '#c6f24e',
  orange: '#f8981d',
  ink: '#14172e',
  white: '#ffffff',
  surface: '#f6f5f1',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
