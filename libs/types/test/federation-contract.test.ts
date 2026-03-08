import { describe, it, expect } from 'vitest';
import {
  defineFederationContract,
  validateFederationContract,
} from '../src/index.js';

// ── defineFederationContract ──────────────────────────────────────────────────

describe('defineFederationContract', () => {
  it('returns the same contract object (identity)', () => {
    const contract = defineFederationContract({
      name: 'dashboard',
      exposes: { './App': null as unknown as object },
    });
    expect(contract.name).toBe('dashboard');
    expect(contract.exposes).toHaveProperty('./App');
  });

  it('preserves the events field', () => {
    const contract = defineFederationContract({
      name: 'dashboard',
      exposes: {},
      events: {
        emits: ['dashboard:action'] as const,
        listens: ['shell:ready'] as const,
      },
    });
    expect(contract.events?.emits).toEqual(['dashboard:action']);
    expect(contract.events?.listens).toEqual(['shell:ready']);
  });

  it('preserves optional remote target', () => {
    const contract = defineFederationContract({
      name: 'payments',
      exposes: {},
      remote: { name: 'payments', entryUrl: 'http://localhost:3002/remoteEntry.js' },
    });
    expect(contract.remote?.entryUrl).toBe('http://localhost:3002/remoteEntry.js');
  });

  it('allows an empty exposes map', () => {
    const contract = defineFederationContract({ name: 'nav', exposes: {} });
    expect(Object.keys(contract.exposes)).toHaveLength(0);
  });

  it('allows multiple expose keys', () => {
    const contract = defineFederationContract({
      name: 'ui',
      exposes: {
        './Button': null as unknown as object,
        './Modal': null as unknown as object,
        './Layout': null as unknown as object,
      },
    });
    expect(Object.keys(contract.exposes)).toHaveLength(3);
  });
});

// ── validateFederationContract ────────────────────────────────────────────────

describe('validateFederationContract', () => {
  const baseContract = defineFederationContract({
    name: 'dashboard',
    exposes: { './App': null as unknown as object },
  });

  it('returns empty array for a valid container', () => {
    const container = { get: async (_key: string) => () => ({}) };
    const violations = validateFederationContract(baseContract, container);
    expect(violations).toHaveLength(0);
  });

  it('returns a violation when container is null', () => {
    const violations = validateFederationContract(baseContract, null);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.field).toBe('container');
  });

  it('returns a violation when container is undefined', () => {
    const violations = validateFederationContract(baseContract, undefined);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.field).toBe('container');
  });

  it('returns a violation when container.get is not a function', () => {
    const badContainer = { get: 'not-a-function' } as unknown as {
      get: (key: string) => Promise<() => unknown>;
    };
    const violations = validateFederationContract(baseContract, badContainer);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.field).toBe('container.get');
    expect(violations[0]?.expected).toBe('function');
    expect(violations[0]?.received).toBe('string');
  });

  it('flags expose keys that do not start with "./"', () => {
    const badContract = defineFederationContract({
      name: 'bad',
      exposes: { 'App': null as unknown as object }, // missing "./"
    });
    const container = { get: async (_key: string) => () => ({}) };
    const violations = validateFederationContract(badContract, container);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.field).toContain('App');
    expect(violations[0]?.expected).toContain('./');
  });

  it('accepts multiple expose keys all starting with "./"', () => {
    const contract = defineFederationContract({
      name: 'ui',
      exposes: {
        './Button': null as unknown as object,
        './Modal': null as unknown as object,
      },
    });
    const container = { get: async (_key: string) => () => ({}) };
    const violations = validateFederationContract(contract, container);
    expect(violations).toHaveLength(0);
  });

  it('returns ContractViolation shape with field, expected, received', () => {
    const violations = validateFederationContract(baseContract, null);
    const v = violations[0];
    expect(v).toHaveProperty('field');
    expect(v).toHaveProperty('expected');
    expect(v).toHaveProperty('received');
  });

  it('returns empty array for contract with no exposes', () => {
    const contract = defineFederationContract({ name: 'empty', exposes: {} });
    const container = { get: async (_key: string) => () => ({}) };
    const violations = validateFederationContract(contract, container);
    expect(violations).toHaveLength(0);
  });
});
