//
// declare module '@' {
//   // declare export type λ<M, First, Second> = {
//   //   +typeclass: M,
//   //   fold<Mʹ>(
//   //     l: (x: First) => λ<Mʹ, any, any>,
//   //     r: (x: Second) => λ<Mʹ, any, any>,
//   //   ): λ<Mʹ, First, Second>
//   // }
// }

declare module '@safareli/free' {
  // import type { λ } from '@'
  // declare export type Cata<+C, +L, +A, +P> = {
  //   Chain<-F>(x: Freeλ, f: F): C,
  //   Lift<-X, -F>(x: X, f: F): L,
  //   Ap(x: Freeλ, y: Freeλ): A,
  //   Pure<-X>(x: X): P,
  // }
  declare export type Mapped<T> = {
    map<S>(fn: (x: T) => S): Mapped<S>,
  }
  declare export type Base<O> = {
    of<I>(x: I): O,
    // foldMap<I, T, B: Base<T>>(f: (x: I) => O, b: B): T,
  }
  declare export type ChainRec<T> = {
    isNext: boolean,
    value: T,
  }
  declare export type ChainRecIterator = <-I, O>(next: ChainRecF, done: ChainRecF, value: I) => ChainRec<O>
  declare export type ChainRecF = <T>(x: T) => ChainRec<T>
  declare export class Pure<A> {
    cata<Aʹ>(d: { Pure(x: A): Aʹ }): Aʹ,
    map<Aʹ>(f: (x: A) => Aʹ): Pure<Aʹ>,
    chain<Aʹ>(f: (x: A) => (Pure<Aʹ> | Lift<Aʹ>)): Pure<Aʹ>,
    // ap(y: *) {
    //   return map(f => f(this.x), y)
    // }
    foldMap<I, O, B: Base<O>>(f: (x: I) => O, b: B): A,
    /*::
    static $call: (<B>(x: B) => Pure<B>)
    */
  }

  declare export class Lift<I, O> {
    cata<Iʹ>(d: { Lift(x: I): Iʹ }): Iʹ,
    map<Oʹ>(f: (x: O) => Oʹ): Lift<I, Oʹ>,
    chain<Iʹ, Oʹ>(f: (x: O) => Lift<Iʹ, Oʹ>): Lift<Iʹ, O>,
    // ap(y: *) {
    //   return map(f => f(this.x), y)
    // }
    foldMap<I, O, B: Base<O>>(f: (x: I) => O, b: B): O,
    /*::
    static $call: (<A, B>(x: A, fn: (x: A) => B) => Lift<A, B>)
    */
  }
  declare export function liftF<T>(command: T): Lift<T, T>
  declare export function of<B>(x: B): Pure<B>
}

declare module 'apropos' {
  // import type { λ } from '@'

  /**
   * Either `Left` or `Right`
   *
   * @interface Apropos
   * @template L
   * @template R
   */
  declare export class Apropos<L, R> {
    // +typeclass: typeof Apropos,
    map<R1>(fn: (x: R) => R1): Apropos<L, R1>,
    mapR<R1>(fn: (x: R) => R1): Apropos<L, R1>,
    mapL<L1>(fn: (x: L) => L1): Apropos<L1, R>,
    bimap<L1, R1>(l: (x: L) => L1, r: (x: R) => R1): Apropos<L1, R1>,


    tap(fn: (x: R) => any): Apropos<L, R>,
    tapR(fn: (x: R) => any): Apropos<L, R>,
    tapL(fn: (x: L) => any): Apropos<L, R>,
    bitap(l: (x: L) => any, r: (x: R) => any): Apropos<L, R>,


    chain<L1, R1>(fn: (x: R) => Apropos<L1, R1>): Apropos<L | L1, R1>,
    chainR<L1, R1>(fn: (x: R) => Apropos<L1, R1>): Apropos<L | L1, R1>,
    chainL<L1, R1>(fn: (x: L) => Apropos<L1, R1>): Apropos<L1, R | R1>,
    bichain<L1, L2, R1, R2>(
      l: (x: L) => Apropos<L2, R2>,
      r: (x: R) => Apropos<L1, R1>
    ): Apropos<L1 | L2, R1 | R2>,


    cond(fn: (x: R) => boolean): boolean,
    chainCond<L1, R1>(
      cond: (x: R) => boolean,
      pass: (x: R) => R1,
      fail: (x: R) => L1
    ): Apropos<L | L1, R1>,
    logic<L1, R1>({
      cond: (x: R) => boolean,
      pass: (x: R) => R1,
      fail: (x: R) => L1
    }): Apropos<L | L1, R1>,


    alt<L1, R1>(e: Apropos<L1, R1>): Apropos<L1, R | R1>,
    or<L1, R1>(e: Apropos<L1, R1>): Apropos<L1, R | R1>,
    and<L1, R1>(e: Apropos<L1, R1>): Apropos<L | L1, R1>,
    ap<L1, R1>(e: Apropos<L1, ((x: R) => R1)>): Apropos<L | L1, R1>,


    thru<L1, R1>(fn: (x: Apropos<L, R>) => Apropos<L1, R1>): Apropos<L1, R1>,
    orElse(value: R): R,
    swap(): Apropos<R, L>,

    /**
     * Converts Apropos to Promise, which resolves with right value or rejects with left
     *
     * @returns {Promise<R>}
     */
    promise(): Promise<R>,
    fold<O>(l: (x: L) => O, r: (x: R) => O): O,


    isRight(): boolean,
    isLeft(): boolean,

    equals(value: any): boolean,
  }

  declare class AnnotatedError<-Tag = '', -Context = mixed> extends Error {
    -tag: Tag,
    -data: Context,
  }

  declare export type MakeError<-Tag = ''> = <-Context>(data: Context) => AnnotatedError<Tag, Context>


  /**
   * Create fabric for generating tagged error constructors
   *
   * Useful in `.mapL`
   *
   * @function makeError
   * @template Tag
   * @param {(Tag|String)} tag
   */
  declare export function makeError<-Tag>(tag: Tag): MakeError<Tag>
  /**
   * Create right-handed value.
   *
   * Left-handed type is inferred from usage
   *
   * @template R
   * @template L
   * @param {R} value
   * @returns {Apropos<L, R>}
   */
  declare export function Right</*::-*/L, R>(value: R): Apropos<L, R>

  /**
   * Create left-handed value.
   *
   * Right-handed type is inferred from usage
   *
   * @template R
   * @template L
   * @param {L} value
   * @returns {Apropos<L, R>}
   */
  declare export function Left<L, /*::-*/R>(value: L): Apropos<L, R>

  /**
   * Create pure right-handed value
   *
   * Left-handed type is empty
   *
   * @template R
   * @param {R} value
   * @returns {Apropos<void, R>}
   */
  declare export function of<R>(value: R): Apropos<void, R>

  /**
   * Create pure left-handed value
   *
   * Right-handed type is empty
   *
   * @template L
   * @param {L} value
   * @returns {Apropos<L, void>}
   */
  declare export function ofL<L>(value: L): Apropos<L, void>


  /**
   * Checks whether an object is an instance of `Apropos`
   *
   * @template T
   * @param {T} value
   * @returns {boolean}
   */
  declare export function is</*::-*/T>(value: T): boolean

  /**
   * Either `Left` or `Right`
   *
   * @interface Either
   * @template L
   * @template R
   */
  declare export class Either<L, R> {
    map<R1>(fn: (x: R) => R1): Either<L, R1>,
    mapR<R1>(fn: (x: R) => R1): Either<L, R1>,
    mapL<L1>(fn: (x: L) => L1): Either<L1, R>,
    bimap<L1, R1>(l: (x: L) => L1, r: (x: R) => R1): Either<L1, R1>,


    tap(fn: (x: R) => any): Either<L, R>,
    tapR(fn: (x: R) => any): Either<L, R>,
    tapL(fn: (x: L) => any): Either<L, R>,
    bitap(l: (x: L) => any, r: (x: R) => any): Either<L, R>,


    chain<L1, R1>(fn: (x: R) => Either<L1, R1>): Either<L | L1, R1>,
    chainR<L1, R1>(fn: (x: R) => Either<L1, R1>): Either<L | L1, R1>,
    chainL<L1, R1>(fn: (x: L) => Either<L1, R1>): Either<L1, R | R1>,
    bichain<L1, L2, R1, R2>(
      l: (x: L) => Either<L2, R2>,
      r: (x: R) => Either<L1, R1>
    ): Either<L1 | L2, R1 | R2>,


    cond(fn: (x: R) => boolean): boolean,
    chainCond<L1, R1>(
      cond: (x: R) => boolean,
      pass: (x: R) => R1,
      fail: (x: R) => L1
    ): Either<L | L1, R1>,
    logic<L1, R1>({
      cond: (x: R) => boolean,
      pass: (x: R) => R1,
      fail: (x: R) => L1
    }): Either<L | L1, R1>,


    alt<L1, R1>(e: Either<L1, R1>): Either<L1, R | R1>,
    or<L1, R1>(e: Either<L1, R1>): Either<L1, R | R1>,
    and<L1, R1>(e: Either<L1, R1>): Either<L | L1, R1>,
    ap<L1, R1>(e: Either<L1, ((x: R) => R1)>): Either<L | L1, R1>,


    thru<L1, R1>(fn: (x: Either<L, R>) => Either<L1, R1>): Either<L1, R1>,
    orElse(value: R): R,
    swap(): Either<R, L>,

    /**
     * Converts Either to Promise, which resolves with right value or rejects with left
     *
     * @returns {Promise<R>}
     */
    promise(): Promise<R>,
    fold<O>(l: (x: L) => O, r: (x: R) => O): O,


    isRight(): boolean,
    isLeft(): boolean,

    equals(value: any): boolean,
  }

  declare export class Maybe<T> {
    map<Tʹ>(fn: (x: T) => Tʹ): Maybe<Tʹ>,
    chain<Tʹ>(fn: (x: T) => Maybe<Tʹ>): Maybe<Tʹ>,
    tap(fn: (x: T) => any): Maybe<T>,
    fold<O>(l: () => O, r: (x: T) => O): O,
    orElse(x: T): T,

    alt<S>(maybe: Maybe<S>): Maybe<T | S>,
    both<S>(maybe: Maybe<S>): Maybe<[T, S]>,
    and<S>(maybe: Maybe<S>): Maybe<S>,

    match<J, N>({
      Just: (x: T) => J,
      Nothing: () => N,
    }): J | N,

    chainCond<Tʹ>(
      cond: (x: T) => boolean,
      pass: (x: T) => Tʹ
    ): Maybe<Tʹ>,
    logic<Tʹ>({
      cond: (x: T) => boolean,
      pass: (x: T) => Tʹ
    }): Maybe<Tʹ>,
    pred(check: (x: T) => boolean): Maybe<T>,

    promise(): Promise<T>,
    equals(value: any): boolean,
    isJust(): boolean,
    isNothing(): boolean,
    static Just<Tʹ>(value: Tʹ): Maybe<Tʹ>,
    static of<Tʹ>(value: Tʹ): Maybe<Tʹ>,
    static fromNullable<Tʹ>(value: ?Tʹ): Maybe<Tʹ>,
    static Nothing<+Tʹ>(): Maybe<Tʹ>,
    static empty<+Tʹ>(): Maybe<Tʹ>,
  }

  declare export class Identity<T> {
    map<O>(f: (x: T) => O): Identity<O>,
    chain<Name, O>(fn: (x: T) => Identity<O>): Identity<O>,
    get(): T,
    equals(value: any): boolean,
    fold<O>(fn: (x: T) => O): O,
  }

  declare export class Tuple<A, B> {
    fst(): A,
    snd(): B,
    bimap<Aʹ, Bʹ>(f: (a: A) => Aʹ, g: (b: B) => Bʹ): Tuple<Aʹ, Bʹ>,
    map<Bʹ>(f: (b: B) => Bʹ): Tuple<A, Bʹ>,
    curry<X>(f: (x: Tuple<A, B>) => X): X,
    uncurry<X>(f: (a: A, b: B) => X): X,
    extend<N>(f: (x: Tuple<A, B>) => N): Tuple<A, N>,
    extract(): B,
    foldl<X, Z>(f: (b: B, z: Z) => X, z: Z): X,
    foldr<X, Z>(f: (z: Z, b: B) => X, z: Z): X,
    equals<Aʹ, Bʹ>(tuple: Tuple<Aʹ, Bʹ>): boolean,
  }
}

declare module 'folktale/maybe' {
  declare export type MaybeMatcher<T, /*::+*/A, /*::+*/B> = {
    Just(res: { value: T }): A,
    Nothing(): B,
  }

  declare export class Maybe<T> {
    getOrElse(onElse: T): T,
    orElse(onElse: T): T,
    map<S>(fn: (obj: T) => S): Maybe<S>,
    chain<S>(fn: (obj: T) => Maybe<S>): Maybe<S>,
    matchWith<A, B>(matcher: MaybeMatcher<T, A, B>): A | B,
    fold<O>(l: () => O, r: (v: T) => O): O,
  }

  declare export function Just<T>(obj: T): Maybe<T>
  declare export function of<T>(obj: T): Maybe<T>
  declare export function Nothing</*::+*/T>(): Maybe<T>
  declare export function empty</*::+*/T>(): Maybe<T>
  declare export function fromNullable<T>(obj: ?T): Maybe<T>
  declare export function hasInstance(obj: any): boolean
}

declare module 'fluture' {
  // import type { λ } from '@'

  declare export type Cancel = () => void

  declare export class Fluture</*::+*/Resolve, /*::+*/Reject> {
    // +typeclass: typeof Fluture,
    map<-T>(fn: (data: Resolve) => T): Fluture<T, Reject>,
    bimap<T, F>(left: (err: Reject) => F, right: (data: Resolve) => T): Fluture<T, F>,
    chain<T, F>(fn:
      (data: Resolve) => Fluture<T, F>
    ): Fluture<T, Reject | F>,
    swap(): Fluture<Reject, Resolve>,
    mapRej<F>(fn: (err: Reject) => F): Fluture<Resolve, F>,
    chainRej<T, F>(fn: (err: Reject) => Fluture<T, F>): Fluture<Resolve | T, F>,
    fork(
      left: (err: Reject) => any,
      right: (data: Resolve) => any
    ): Cancel,
    promise(): Promise<Resolve>,

    or<T, F>(alt: Fluture<T, F>): Fluture<Resolve | T, Reject | F>,
    and<T, F>(alt: Fluture<T, F>): Fluture<T, Reject | F>,
    race<T, F>(futureB: Fluture<T, F>): Fluture<Resolve | T, Reject | F>,
    both<T, F>(futureB: Fluture<T, F>): Fluture<[Resolve, T], Reject | F>,
    fold<T, F>(
      left: (val: Reject) => F,
      right: (val: Resolve) => T
    ): Fluture<T | F, void>,
    value(): Resolve,
    lastly<T, F>(futureB: Fluture<T, F>): Fluture<Resolve, Reject | F>,
    /*::
    static $call: typeof FutureF
    */
  }

  // declare export opaque type λFluture<A, B>: λ<typeof Fluture, A, B>

  declare type Go = <-Resolve, Reject, +Return>(
    gen: Generator<Fluture<Resolve, Reject>, Resolve, Return>
  ) => Fluture<Return, Reject>

  declare export var go: Go

  declare export function fold<IL, IR, OL, OR>(
    left: (val: IL) => OL,
    right: (val: IR) => OR,
    future: Fluture<IR, IL>
  ): Fluture<OR & OL, void>

  declare export function chain<IR, OR, OL>(
    fn: (x: IR) => Fluture<OR, OL>
  ): (
    <IL>(future: Fluture<IR, IL>) => Fluture<OR, IL | OL>
  )

  declare function FutureF<Resolve, Reject>(fn: (rj: (err: Reject) => void, rs: (data: Resolve) => void) => ((() => void) | void)): Fluture<Resolve, Reject>
  declare export var Future: typeof Fluture
  declare export function encaseP3<A, B, C, Resolve>(fn:(a: A, b: B, c: C) => Promise<Resolve>): (a: A, b: B, c: C) => Fluture<Resolve, mixed>


  declare export function encase3<A, B, C, Resolve>(fn:(a: A, b: B, c: C) => Resolve): (a: A) => (b: B) => (b: B) => Fluture<Resolve, mixed>


  declare export function encaseP<A, T, /*::+*/F>(fn:(a: A) => Promise<T>, noa: void): (a: A) => Fluture<T, F>
  declare export function encaseP<A, T, /*::+*/F>(fn:(a: A) => Promise<T>, a: A): Fluture<T, F>

  declare export type FutureFabric1</*::-*/A, T, F> = (x: A) => Fluture<T, F>
  declare export type FutureFabric2C1</*::-*/A, /*::-*/B, T, F> = (a: A) => FutureFabric1<B, T, F>
  declare export type FutureFabric2C2</*::-*/A, /*::-*/B, T, F> = (a: A, b: B) => Fluture<T, F>

  declare export type Encased2<
  /*::+*/A,
  /*::+*/B,
  /*::+*/T,
  /*::+*/F/*::,
  +Fab: (
    & FutureFabric2C1<A, B, T, F>
    & FutureFabric2C2<A, B, T, F>
  ) = (
    & FutureFabric2C1<A, B, T, F>
    & FutureFabric2C2<A, B, T, F>
  )*/> /*:: = Fab;
  declare type Nop1<A, B, T, F> */ = FutureFabric2C1<A, B, T, F> & FutureFabric2C2<A, B, T, F>

  declare export function encaseP2<A, B, T, /*::+*/F>(fn: (a: A, b: B) => Promise<T>, noa: void, nob: void): Encased2<A, B, T, F>
  declare export function encaseP2<A, B, T, /*::+*/F>(fn: (a: A, b: B) => Promise<T>, a: A, noa: void): (b: B) => Fluture<T, F>
  declare export function encaseP2<A, B, T, /*::+*/F>(fn: (a: A, b: B) => Promise<T>, a: A, b: B): Fluture<T, F>


  declare export function encase2<A, B, T, /*::+*/F>(fn: (a: A, b: B) => T, noa: void, nob: void): (
    | ((a: A, noc: void) => (b: B) => Fluture<T, F>)
    | ((a: A, b: B) => Fluture<T, F>)
  )
  declare export function encase2<A, B, T, /*::+*/F>(fn: (a: A, b: B) => T, a: A, noa: void): (b: B) => Fluture<T, F>
  declare export function encase2<A, B, T, /*::+*/F>(fn: (a: A, b: B) => T, a: A, b: B): Fluture<T, F>


  declare export function encase<I, O, /*::+*/F>(fn:(x: I) => O, noa: void): (x: I) => Fluture<O, F>
  declare export function encase<I, O, /*::+*/F>(fn:(x: I) => O, x: I): Fluture<O, F>

  declare export function attempt<T, /*::+*/F>(fn: () => T): Fluture<T, F>
  declare export function tryP<T, /*::+*/F>(fn: () => Promise<T>): Fluture<T, F>

  declare export function reject</*::+*/T, F>(error: F): Fluture<T, F>
  declare export function resolve<T, /*::+*/F>(value: T): Fluture<T, F>

  declare export function after<T, /*::+*/F>(time: number, value: T): Fluture<T, F>
  declare export function rejectAfter</*::+*/T, F>(time: number, value: F): Fluture<T, F>

  declare export function both<TA, FA, TB, FB>(futureA: Fluture<TA, FA>, noa: void): (futureB: Fluture<TB, FB>) => Fluture<[TA, TB], FA | FB>
  declare export function both<TA, FA, TB, FB>(futureA: Fluture<TA, FA>, futureB: Fluture<TB, FB>): Fluture<[TA, TB], FA | FB>
  declare export function or<TA, FA, TB, FB>(futureA: Fluture<TA, FA>, futureB: Fluture<TB, FB>): Fluture<TA | TB, FA | FB>

  declare export function and</*::-*/TA, FA, TB, FB>(futureA: Fluture<TA, FA>, noa: void): (
    (futureB: Fluture<TB, FB>) => Fluture<TB, FA | FB>
  )
  declare export function and</*::-*/TA, FA, TB, FB>(futureA: Fluture<TA, FA>, futureB: Fluture<TB, FB>): Fluture<TB, FA | FB>

  declare export function ap<I, O, FA, FB>(
    futureFn: Fluture<((x: I) => O), FA>,
    noa: void
  ): ((futureArg: Fluture<I, FB>) => Fluture<O, FA | FB>)
  declare export function ap<I, O, FA, FB>(
    futureFn: Fluture<((x: I) => O), FA>,
    futureArg: Fluture<I, FB>
  ): Fluture<O, FA | FB>

  declare export function bimap<TA, FA, TB, FB>(
    left: (x: FA) => FB,
    noa: void,
    nob: void
  ): (
    | ((right: (x: TA) => TB, noc: void) =>
        (future: Fluture<TA, FA>) => Fluture<TB, FB>)
    | ((right: (x: TA) => TB, future: Fluture<TA, FA>) => Fluture<TB, FB>)
  )
  declare export function bimap<TA, FA, TB, FB>(
    left: (x: FA) => FB,
    right: (x: TA) => TB,
    noa: void
  ): (future: Fluture<TA, FA>) => Fluture<TB, FB>
  declare export function bimap<TA, FA, TB, FB>(
    left: (x: FA) => FB,
    right: (x: TA) => TB,
    future: Fluture<TA, FA>
  ): Fluture<TB, FB>

  declare export function map<I, O, Reject>(fn: (x: I) => O, noa: void): (future: Fluture<I, Reject>) => Fluture<O, Reject>
  declare export function map<I, O, Reject>(fn: (x: I) => O, future: Fluture<I, Reject>): Fluture<O, Reject>

  declare export function mapRej<I, O, Resolve>(fn: (x: I) => O, noa: void): (future: Fluture<Resolve, I>) => Fluture<Resolve, O>
  declare export function mapRej<I, O, Resolve>(fn: (x: I) => O, future: Fluture<Resolve, I>): Fluture<Resolve, O>

  declare export function race<TA, FA, TB, FB>(
    futureA: Fluture<TA, FA>,
    noa: void
  ): ((futureB: Fluture<TB, FB>) => Fluture<TA | TB, FA | FB>)
  declare export function race<TA, FA, TB, FB>(
    futureA: Fluture<TA, FA>,
    futureB: Fluture<TB, FB>
  ): Fluture<TA | TB, FA | FB>

  declare export function promise<T, /*::-*/F>(future: Fluture<T, F>): Promise<T>

  declare export function cache<Resolve, Reject>(future: Fluture<Resolve, Reject>): Fluture<Resolve, Reject>
  declare export function isFuture(value: mixed): boolean /*:: %checks ( value instanceof Fluture ) */
  declare export function never</*::+*/Resolve, /*::+*/Reject>(): Fluture<Resolve, Reject>
  declare type Mapping</*::-*/I, O, Reject> = (result: I) => Fluture<O, Reject>
  declare type MapInferResult</*::-*/I, Reject> = <O>(result: I) => Fluture<O, Reject>

  declare export function hook<T, F, FDispose, FConsume, Next>(
    acquire: Fluture<T, F>,
    noa: void,
    nob: void
  ): (
    | ((dispose: MapInferResult<T, FDispose>, noc: void) =>
        (consume: Mapping<T, Next, FConsume>) => Fluture<Next, F | FDispose | FConsume>)
    | ((dispose: MapInferResult<T, FDispose>, consume: Mapping<T, Next, FConsume>) => Fluture<Next, F | FDispose | FConsume>)
  )
  declare export function hook<T, F, FDispose, FConsume, Next>(
    acquire: Fluture<T, F>,
    dispose: MapInferResult<T, FDispose>,
    noa: void
  ): (consume: Mapping<T, Next, FConsume>) => Fluture<Next, F | FDispose | FConsume>
  declare export function hook<T, F, FDispose, FConsume, Next>(
    acquire: Fluture<T, F>,
    dispose: MapInferResult<T, FDispose>,
    consume: Mapping<T, Next, FConsume>
  ): Fluture<Next, F | FDispose | FConsume>


  declare export function fork<T, F>(
    left: (x: F) => any,
    noa: void,
    nob: void
  ): (
    | ((right: (x: T) => any, noc: void) =>
        (future: Fluture<T, F>) => Cancel)
    | ((right: (x: T) => any, future: Fluture<T, F>) => Cancel)
  )
  declare export function fork<T, F>(
    left: (x: F) => any,
    right: (x: T) => any,
    noa: void
  ): (future: Fluture<T, F>) => Cancel
  declare export function fork<T, F>(
    left: (x: F) => any,
    right: (x: T) => any,
    future: Fluture<T, F>
  ): Cancel

  declare export function of<T, /*::+*/F>(value: T): Fluture<T, F>
}
