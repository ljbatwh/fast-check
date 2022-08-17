import { toPoisoningFreeMap } from '../../src/internals/PoisoningFreeMap.js';
import { trackDiffsOnGlobals } from '../../src/internals/TrackDiffsOnGlobal.js';
import { AllGlobals, GlobalDetails } from '../../src/internals/types/AllGlobals.js';

describe('trackDiffsOnGlobals', () => {
  it('should detect added entries', () => {
    // Arrange
    const globalA: any = {};
    const allGlobals: AllGlobals = toPoisoningFreeMap(
      new Map<unknown, GlobalDetails>([[globalA, extractGlobalDetailsFor('globalA', globalA)]])
    );
    globalA.a = 2; // adding key onto a tracked global

    // Act
    const diff = trackDiffsOnGlobals(allGlobals);
    expect(globalA).not.toEqual({});
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({ type: 'added', keyName: 'globalA.a', patch: expect.any(Function) });
    expect(globalA).toEqual({});
  });

  it('should detect added symbols entries', () => {
    // Arrange
    const addedSymbol = Symbol('my-symbol');
    const globalA: any = {};
    const allGlobals: AllGlobals = toPoisoningFreeMap(
      new Map<unknown, GlobalDetails>([[globalA, extractGlobalDetailsFor('globalA', globalA)]])
    );
    globalA[addedSymbol] = 2; // adding key onto a tracked global

    // Act
    const diff = trackDiffsOnGlobals(allGlobals);
    expect(globalA).not.toEqual({});
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({ type: 'added', keyName: 'globalA.Symbol(my-symbol)', patch: expect.any(Function) });
    expect(globalA).toEqual({});
  });

  it('should detect added non-enumerable entries', () => {
    // Arrange
    const globalA: any = {};
    const allGlobals: AllGlobals = toPoisoningFreeMap(
      new Map<unknown, GlobalDetails>([[globalA, extractGlobalDetailsFor('globalA', globalA)]])
    );
    Object.defineProperty(globalA, 'a', { configurable: true, enumerable: false, writable: false, value: 2 }); // adding key onto a tracked global

    // Act
    const diff = trackDiffsOnGlobals(allGlobals);
    expect('a' in globalA).toBe(true);
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({ type: 'added', keyName: 'globalA.a', patch: expect.any(Function) });
    expect('a' in globalA).toBe(false);
  });

  it('should detect removed entries', () => {
    // Arrange
    const globalA: any = { a: 2 };
    const allGlobals: AllGlobals = toPoisoningFreeMap(
      new Map<unknown, GlobalDetails>([[globalA, extractGlobalDetailsFor('globalA', globalA)]])
    );
    delete globalA.a; // deleting key from a tracked global

    // Act
    const diff = trackDiffsOnGlobals(allGlobals);
    expect(globalA).not.toEqual({ a: 2 });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({ type: 'removed', keyName: 'globalA.a', patch: expect.any(Function) });
    expect(globalA).toEqual({ a: 2 });
  });

  it('should detect changed entries', () => {
    // Arrange
    const globalA: any = { a: 2 };
    const allGlobals: AllGlobals = toPoisoningFreeMap(
      new Map<unknown, GlobalDetails>([[globalA, extractGlobalDetailsFor('globalA', globalA)]])
    );
    globalA.a = 3; // updating value linked to a key from a tracked global

    // Act
    const diff = trackDiffsOnGlobals(allGlobals);
    expect(globalA).not.toEqual({ a: 2 });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({ type: 'changed', keyName: 'globalA.a', patch: expect.any(Function) });
    expect(globalA).toEqual({ a: 2 });
  });
});

// Helpers

function extractGlobalDetailsFor(itemName: string, item: unknown): GlobalDetails {
  return {
    name: itemName,
    properties: toPoisoningFreeMap(
      new Map(
        [...Object.getOwnPropertyNames(item), ...Object.getOwnPropertySymbols(item)].map((keyName) => [
          keyName,
          Object.getOwnPropertyDescriptor(item, keyName)!,
        ])
      )
    ),
  };
}
