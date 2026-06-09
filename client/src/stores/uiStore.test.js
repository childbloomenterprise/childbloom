import { describe, it, expect, beforeEach } from 'vitest';
import useUiStore from './uiStore';

// The modal counter drives whether the bottom tab bar + floating SOS hide
// while a bottom-sheet is open (so they never cover the sheet's Save button).
describe('uiStore modal counter', () => {
  beforeEach(() => {
    useUiStore.setState({ modalCount: 0 });
  });

  it('starts closed', () => {
    expect(useUiStore.getState().modalCount).toBe(0);
  });

  it('opening increments, closing decrements', () => {
    useUiStore.getState().openModal();
    expect(useUiStore.getState().modalCount).toBe(1);
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().modalCount).toBe(0);
  });

  it('handles stacked sheets (counter, not boolean)', () => {
    const { openModal, closeModal } = useUiStore.getState();
    openModal();
    openModal();
    expect(useUiStore.getState().modalCount).toBe(2);
    closeModal();
    expect(useUiStore.getState().modalCount).toBe(1); // still "open"
    closeModal();
    expect(useUiStore.getState().modalCount).toBe(0);
  });

  it('never goes below zero on an extra close', () => {
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().modalCount).toBe(0);
  });
});
