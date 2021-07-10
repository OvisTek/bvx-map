import { MortonKey, VoxelChunk, VoxelIndex } from "@ovistek/bvx.ts";
import { SimplexNoiseGenerator } from "../noise/simplex-noise-generator";

/**
 * Allows generating psuedo-random Voxel Maps
 */
export class VoxelMap {
    private static readonly _tmpIndex: VoxelIndex = new VoxelIndex();
    private readonly _generator: SimplexNoiseGenerator;

    constructor(seed: number = 0) {
        this._generator = new SimplexNoiseGenerator(seed);
    }

    /**
     * Generate a map for the provided Voxel Chunk
     * @param chunk - The Chunk to use for generating a Voxel
     */
    public generate(chunk: VoxelChunk | null = null): void {
        if (!chunk) {
            throw new Error("VoxelMap.generate(chunk) - requires a valid chunk");
        }

        // this is the local coordinate of the provided chunk
        const localCoordinate: MortonKey = chunk.key;
        const vxSize: number = VoxelChunk.SIZE;
        const btSize: number = VoxelChunk.BVX_SUBDIV;

        // convert from local to world coordinate
        const worldCoordX: number = localCoordinate.x * vxSize;
        const worldCoordY: number = localCoordinate.y * vxSize;
        const worldCoordZ: number = localCoordinate.z * vxSize;

        const vindex: VoxelIndex = VoxelMap._tmpIndex;
        const gen: SimplexNoiseGenerator = this._generator;

        const totalVoxels = (vxSize * vxSize * vxSize) * (btSize * btSize * btSize);

        // for every bit-voxel, we run the noise algorithm
        for (let vx: number = 0; vx < totalVoxels; vx++) {
            // sets the voxel index
            vindex.key = vx;

            const worldCoordBVX: number = worldCoordX + vindex.vx + (vindex.bx / btSize);
            const worldCoordBVY: number = worldCoordY + vindex.vy + (vindex.by / btSize);
            const worldCoordBVZ: number = worldCoordZ + vindex.vz + (vindex.bz / btSize);

            // get the noise for the provided BitVoxel at provided world coordinate
            const density: number = gen.getDensity(worldCoordBVX, worldCoordBVY, worldCoordBVZ);

            // decide if we want to set or unset the bitvoxel at provided position
            if (density > 0.8) {
                chunk.setBitVoxel(vindex);
            }
            else {
                chunk.unsetBitVoxel(vindex);
            }
        }
    }
}