export type InstanceConstructor<T> = new (...args: any[]) => T;

export class SingletonStorage<T = unknown> {
  private readonly instances = new Map<InstanceConstructor<T>, T>();

  register<C extends T>(ctor: InstanceConstructor<C>, instance: C): C {
    if (this.instances.has(ctor)) {
      return this.instances.get(ctor) as C;
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
}
