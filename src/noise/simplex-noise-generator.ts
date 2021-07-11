import { Random64 } from "../util/random-64";
import { Util } from "../util/util";

export interface SimplexNoiseGeneratorSettings {
    seed: number;
    octaves: number;
    multiplier: number;
    amplitude: number;
    lacunarity: number;
    persistence: number;
}

/**
 * TypeScript implementation for a Simplex Noise Generator
 * See https://gist.github.com/jstanden/1489447
 * 
 * Modified slightly to work properly with web
 */
export class SimplexNoiseGenerator {
    public static readonly DEFAULT_SETTINGS: SimplexNoiseGeneratorSettings = {
        seed: 42,
        octaves: 1,
        multiplier: 25,
        amplitude: 0.5,
        lacunarity: 2.0,
        persistence: 0.9
    }

    private static readonly ONE_THIRD: number = 0.333333333;
    private static readonly ONE_SIXTH: number = 0.166666667;

    // arrays
    private readonly _A: Int32Array = new Int32Array(3);
    private readonly _T: Int32Array = new Int32Array(8);
    private readonly _settings: SimplexNoiseGeneratorSettings;

    // floats
    private _u: number = 0.0;
    private _v: number = 0.0;
    private _w: number = 0.0;

    // integers
    private _i: number = 0 | 0;
    private _j: number = 0 | 0;
    private _k: number = 0 | 0;

    constructor(settings: SimplexNoiseGeneratorSettings | null = null) {
        this._settings = settings || SimplexNoiseGenerator.DEFAULT_SETTINGS;

        const rng: Random64 = new Random64(this._settings.seed);

        for (let q: number = 0; q < 8; q++) {
            this._T[q] = rng.next();
        }
    }

    public coherentNoise(x: number, y: number, z: number): number {
        const settings: SimplexNoiseGeneratorSettings = this._settings;

        let vx: number = x / settings.multiplier;
        let vy: number = y / settings.multiplier;
        let vz: number = z / settings.multiplier;
        let val: number = 0.0;

        let amplitude = settings.amplitude;

        for (let n: number = 0; n < settings.octaves; n++) {
            val += this._noise(vx, vy, vz) * amplitude;

            vx *= settings.lacunarity;
            vy *= settings.lacunarity;
            vz *= settings.lacunarity;

            amplitude *= settings.persistence;
        }

        return val;
    }

    public getDensity(x: number, y: number, z: number): number {
        const val: number = this.coherentNoise(x, y, z);

        return Util.lerp(0, 255, val) | 0;
    }

    public getHeight(x: number, y: number, z: number, min: number, max: number): number {
        const val: number = this.coherentNoise(x, y, z);

        return Util.map(val, -1, 1, min, max);
    }

    private _noise(x: number, y: number, z: number): number {
        const onethird: number = SimplexNoiseGenerator.ONE_THIRD;
        const onesixth: number = SimplexNoiseGenerator.ONE_SIXTH;
        const A: Int32Array = this._A;

        let s: number = (x + y + z) * onethird;
        const i: number = Math.floor(x + s);
        const j: number = Math.floor(y + s);
        const k: number = Math.floor(z + s);

        s = (i + j + k) * onesixth;
        const u: number = x - i + s;
        const v: number = y - j + s;
        const w: number = z - k + s;

        A[0] = 0;
        A[1] = 0;
        A[2] = 0;

        this._i = i;
        this._j = j;
        this._k = k;
        this._u = u;
        this._v = v;
        this._w = w;

        const hi: number = u >= w ? u >= v ? 0 : 1 : v >= w ? 1 : 2;
        const lo: number = u < w ? u < v ? 0 : 1 : v < w ? 1 : 2;

        return this._kay(hi) + this._kay(3 - hi - lo) + this._kay(lo) + this._kay(0);
    }

    private _kay(a: number): number {
        const onesixth: number = SimplexNoiseGenerator.ONE_SIXTH;
        const A: Int32Array = this._A;

        const s: number = (A[0] + A[1] + A[2]) * onesixth;
        const x: number = this._u - A[0] + s;
        const y: number = this._v - A[1] + s;
        const z: number = this._w - A[2] + s;
        let t: number = 0.6 - x * x - y * y - z * z;

        const h: number = this._shuffle(this._i + A[0], this._j + A[1], this._k + A[2]);

        A[a]++;

        if (t < 0) {
            return 0;
        }

        const b5: number = h >> 5 & 1;
        const b4: number = h >> 4 & 1;
        const b3: number = h >> 3 & 1;
        const b2: number = h >> 2 & 1;
        const b1: number = h & 3;

        let p: number = b1 == 1 ? x : b1 == 2 ? y : z;
        let q: number = b1 == 1 ? y : b1 == 2 ? z : x;
        let r: number = b1 == 1 ? z : b1 == 2 ? x : y;

        p = b5 == b3 ? -p : p;
        q = b5 == b4 ? -q : q;
        r = b5 != (b4 ^ b3) ? -r : r;
        t *= t;

        return 8 * t * t * (p + (b1 == 0 ? q + r : b2 == 0 ? q : r));
    }

    private _shuffle(i: number, j: number, k: number): number {
        return this._b1(i, j, k, 0) + this._b1(j, k, i, 1) + this._b1(k, i, j, 2) + this._b1(i, j, k, 3) + this._b1(j, k, i, 4) + this._b1(k, i, j, 5) + this._b1(i, j, k, 6) + this._b1(j, k, i, 7);
    }

    private _b1(i: number, j: number, k: number, B: number): number {
        return this._T[this._b2(i, B) << 2 | this._b2(j, B) << 1 | this._b2(k, B)];
    }

    private _b2(N: number, B: number): number {
        return N >> B & 1;
    }
}