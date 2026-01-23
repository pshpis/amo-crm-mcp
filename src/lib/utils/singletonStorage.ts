// Using any[] is necessary here because different constructors have different parameter types
// This is a common pattern for dependency injection containers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InstanceConstructor<T> = new (...args: any[]) => T;

export interface SingletonStorageOptions {
  /**
   * If true, attempting to register a different instance for the same constructor
   * will throw an error. If false, returns the existing instance.
   * @default false
   */
  strictMode?: boolean;
}

export class SingletonStorage<T = unknown> {
  private readonly instances = new Map<InstanceConstructor<T>, T>();
  private readonly options: SingletonStorageOptions;

  constructor(options: SingletonStorageOptions = {}) {
    this.options = { strictMode: false, ...options };
  }

  register<C extends T>(ctor: InstanceConstructor<C>, instance: C): C {
    const existing = this.instances.get(ctor);
    if (existing !== undefined) {
      if (this.options.strictMode && existing !== instance) {
        throw new Error(
          `Instance for ${ctor.name} is already registered. ` +
            `Use get() or getOrCreate() instead, or enable non-strict mode.`
        );
      }
      return existing as C;
    }
    this.instances.set(ctor, instance);
    return instance;
  }

  get<C extends T>(ctor: InstanceConstructor<C>): C | undefined {
    return this.instances.get(ctor) as C | undefined;
  }

  getOrCreate<C extends T>(ctor: InstanceConstructor<C>, factory: () => C): C {
    const existing = this.get<C>(ctor);
    if (existing) {
      return existing;
    }
    const instance = factory();
    this.instances.set(ctor, instance);
    return instance;
  }

  has<C extends T>(ctor: InstanceConstructor<C>): boolean {
    return this.instances.has(ctor);
  }

  clear(): void {
    this.instances.clear();
  }
}
