/**
 * Modified version of XORShift 64 bit PRNG. This is designed more for speed
 * rather than randomness, however it is still more random than the standard
 * Math.random() function and is faster too
 * 
 * Based on XORShift 64 bit Java Implementation at https://jvm-gaming.org/t/random-number-generator/39968
 */
export class Random64 {
    // statically available version of Random64 for quick access
    private static readonly _instance: Random64 = new Random64();

    private _seed: number;

    constructor(seed: number = 0) {
        // create the initial seed
        this._seed = seed === 0 ? Math.random() : seed;
    }

    /**
     * Get the next random number
     */
    public next(): number {
        let seed: number = this._seed | 0;

        seed ^= (seed << 13);
        seed ^= (seed >>> 17);
        seed ^= (seed << 5);

        this._seed = seed;

        return seed;
    }

    /**
     * Get the next random number from a static instance of the PRNG
     */
    public static next(): number {
        return Random64._instance.next();
    }

    /**
     * Returns a random number between min and max
     * 
     * @param min - the minimum value to use
     * @param max - the maximum value to use
     */
    public rand(min: number, max: number): number {
        if (min > max) {
            return this.rand(max, min);
        }

        if (min === max) {
            return min;
        }

        return (this.next() % (max + 1 - min)) + min;
    }

    /**
     * Returns a random number between min and max from a static instance of the PRNG
     *
     * @param min - the minimum value to use
     * @param max - the maximum value to use
     */
    public static rand(min: number, max: number): number {
        return Random64._instance.rand(min, max);
    }
}