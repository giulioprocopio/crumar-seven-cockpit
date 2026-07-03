/**
 * A tiny typed event emitter.
 *
 * `Events` maps each event name to its handler signature. `on` returns an
 * unsubscribe function; `emit` is type-checked against that map.
 */
export class Emitter<Events> {
  private readonly handlers = new Map<keyof Events, Set<unknown>>();

  /** Subscribe `handler` to `event`; returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, handler: Events[K]): () => void {
    const set = this.handlers.get(event) ?? new Set<unknown>();
    this.handlers.set(event, set);
    set.add(handler);
    return () => set.delete(handler);
  }

  /** Call every handler subscribed to `event` with `args`. */
  emit<K extends keyof Events>(
    event: K,
    ...args: Events[K] extends (...a: infer A) => void ? A : never
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }
}
