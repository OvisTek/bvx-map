export class Util {
    public static lerp(a: number, b: number, t: number): number {
        return (1.0 - t) * a + t * b;
    }
}