// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - CIRCUIT BREAKER
// Conforms strictly to Sections 46 & 81 of Payment Specification
// ==============================================================================

import { CircuitBreakerState, ProviderCapability } from './types';

export class CircuitBreakerManager {
  private breakerMap: Map<string, {
    state: CircuitBreakerState;
    consecutiveFailures: number;
    failureThreshold: number;
    cooldownSeconds: number;
    lastFailureAt?: number;
    cooldownUntil?: number;
    halfOpenProbeInFlight: boolean;
  }> = new Map();

  constructor() {}

  public registerProvider(providerId: string, failureThreshold: number = 5, cooldownSeconds: number = 60) {
    if (!this.breakerMap.has(providerId)) {
      this.breakerMap.set(providerId, {
        state: 'CLOSED',
        consecutiveFailures: 0,
        failureThreshold,
        cooldownSeconds,
        halfOpenProbeInFlight: false
      });
    }
  }

  public getCircuitStatus(providerId: string): {
    state: CircuitBreakerState;
    consecutiveFailures: number;
    cooldownUntil?: string;
    canExecute: boolean;
  } {
    const cb = this.breakerMap.get(providerId);
    if (!cb) {
      return { state: 'CLOSED', consecutiveFailures: 0, canExecute: true };
    }

    const now = Date.now();

    // Check if OPEN cooldown has expired -> transition to HALF_OPEN
    if (cb.state === 'OPEN' && cb.cooldownUntil && now >= cb.cooldownUntil) {
      cb.state = 'HALF_OPEN';
      cb.halfOpenProbeInFlight = false;
    }

    if (cb.state === 'CLOSED') {
      return { state: 'CLOSED', consecutiveFailures: cb.consecutiveFailures, canExecute: true };
    }

    if (cb.state === 'HALF_OPEN') {
      // Allow single probe request
      if (!cb.halfOpenProbeInFlight) {
        cb.halfOpenProbeInFlight = true;
        return { state: 'HALF_OPEN', consecutiveFailures: cb.consecutiveFailures, canExecute: true };
      }
      return { state: 'HALF_OPEN', consecutiveFailures: cb.consecutiveFailures, canExecute: false };
    }

    // OPEN state
    return {
      state: 'OPEN',
      consecutiveFailures: cb.consecutiveFailures,
      cooldownUntil: cb.cooldownUntil ? new Date(cb.cooldownUntil).toISOString() : undefined,
      canExecute: false
    };
  }

  public recordSuccess(providerId: string): void {
    const cb = this.breakerMap.get(providerId);
    if (!cb) return;

    cb.consecutiveFailures = 0;
    cb.state = 'CLOSED';
    cb.halfOpenProbeInFlight = false;
    cb.lastFailureAt = undefined;
    cb.cooldownUntil = undefined;
  }

  public recordFailure(providerId: string): void {
    let cb = this.breakerMap.get(providerId);
    if (!cb) {
      this.registerProvider(providerId);
      cb = this.breakerMap.get(providerId)!;
    }

    const now = Date.now();
    cb.consecutiveFailures += 1;
    cb.lastFailureAt = now;
    cb.halfOpenProbeInFlight = false;

    if (cb.consecutiveFailures >= cb.failureThreshold || cb.state === 'HALF_OPEN') {
      cb.state = 'OPEN';
      cb.cooldownUntil = now + cb.cooldownSeconds * 1000;
    }
  }

  public resetCircuit(providerId: string): void {
    const cb = this.breakerMap.get(providerId);
    if (cb) {
      cb.state = 'CLOSED';
      cb.consecutiveFailures = 0;
      cb.halfOpenProbeInFlight = false;
      cb.lastFailureAt = undefined;
      cb.cooldownUntil = undefined;
    }
  }
}

export const circuitBreaker = new CircuitBreakerManager();
