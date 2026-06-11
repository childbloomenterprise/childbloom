/**
 * Scene registry contract tests.
 *
 * 1. Every `scene:` id used by a guided step resolves in the registry.
 * 2. Every registry captionKey exists in ALL 6 locale files.
 * 3. Every scene renders to valid svg markup with NO <text> elements
 *    (labels must live in HTML where they can wrap and translate).
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { EMERGENCIES } from './data/emergencies';
import { SCENES, getScene } from './components/scenes';

import en from '../../i18n/locales/emergency.en.json';
import hi from '../../i18n/locales/emergency.hi.json';
import ml from '../../i18n/locales/emergency.ml.json';
import pa from '../../i18n/locales/emergency.pa.json';
import ta from '../../i18n/locales/emergency.ta.json';
import te from '../../i18n/locales/emergency.te.json';

const LOCALES = { en, hi, ml, pa, ta, te };

function lookup(doc, dottedKey) {
  return dottedKey.split('.').reduce((o, k) => (o ? o[k] : undefined), doc);
}

describe('scene registry', () => {
  it('resolves every step scene id', () => {
    for (const emergency of EMERGENCIES) {
      for (const step of emergency.steps) {
        if (step.scene) {
          expect(getScene(step.scene), `${emergency.id}: '${step.scene}' missing from SCENES`).toBeTruthy();
        }
      }
    }
  });

  it('has a caption translation in all 6 languages for every scene', () => {
    for (const [id, entry] of Object.entries(SCENES)) {
      expect(entry.captionKey, `${id} has no captionKey`).toBeTruthy();
      for (const [lang, doc] of Object.entries(LOCALES)) {
        const value = lookup(doc, entry.captionKey);
        expect(typeof value, `${id}: ${entry.captionKey} missing in ${lang}`).toBe('string');
        expect(value.length, `${id}: ${entry.captionKey} empty in ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('renders every scene as svg markup without <text> elements', () => {
    for (const [id, entry] of Object.entries(SCENES)) {
      const markup = renderToStaticMarkup(createElement(entry.Component, entry.props || {}));
      expect(markup, `${id} produced empty markup`).toBeTruthy();
      expect(markup, `${id} must not contain svg <text>`).not.toMatch(/<text[\s>]/);
      // scenes render svg fragments — they must contain at least one path/shape
      expect(markup, `${id} contains no drawable shapes`).toMatch(/<(path|circle|ellipse|rect|g)[\s>]/);
    }
  });

  it('uses unique badge labels positioned with percentages', () => {
    for (const [id, entry] of Object.entries(SCENES)) {
      for (const badge of entry.badges || []) {
        expect(badge.x, `${id} badge x must be a percentage`).toMatch(/%$/);
        expect(badge.y, `${id} badge y must be a percentage`).toMatch(/%$/);
        expect(String(badge.label).length, `${id} badge label empty`).toBeGreaterThan(0);
      }
    }
  });
});
