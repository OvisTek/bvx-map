import { MortonKey, VoxelChunk, VoxelIndex } from "@ovistek/bvx.ts";
import { SimplexNoiseGenerator, SimplexNoiseGeneratorSettings } from "../noise/simplex-noise-generator";

/**
 * Allows generating psuedo-random Voxel Maps
 */
export class VoxelMap {
    private static readonly _tmpIndex: VoxelIndex = new VoxelIndex();
    private readonly _generator: SimplexNoiseGenerator;

    constructor(settings: SimplexNoiseGeneratorSettings | null = null) {
        this._generator = new SimplexNoiseGenerator(settings);
    }

    /**
     * Generate a map for the provided Voxel Chunk
     * @param chunk - The Chunk to use for generating a Voxel
     */
    public generate(chunk: VoxelChunk | null = null, densityCheck: number = 0.8): void {
        if (!chunk) {
            throw new Error("VoxelMap.generate(chunk) - requires a valid chunk");
        }

        // this is the local coordinate of the provided chunk
        const localCoordinate: MortonKey = chunk.key;
        const vxSize: number = VoxelChunk.SIZE;
        const bvSize: number = VoxelChunk.BVX_SUBDIV;
        const mapOffset: number = vxSize * bvSize;

        // convert from local to world coordinate
        const worldCoordX: number = localCoordinate.x * mapOffset;
        const worldCoordY: number = localCoordinate.y * mapOffset;
        const worldCoordZ: number = localCoordinate.z * mapOffset;

        const vindex: VoxelIndex = VoxelMap._tmpIndex;
        const gen: SimplexNoiseGenerator = this._generator;

        const totalVoxels = (vxSize * vxSize * vxSize) * (bvSize * bvSize * bvSize);

        // for every bit-voxel, we run the noise algorithm
        for (let vx: number = 0; vx < totalVoxels; vx++) {
            // sets the voxel index
            vindex.key = vx;

            const worldCoordBVX: number = worldCoordX + (vindex.vx * vxSize) + vindex.bx;
            const worldCoordBVY: number = worldCoordY + (vindex.vy * vxSize) + vindex.by;
            const worldCoordBVZ: number = worldCoordZ + (vindex.vz * vxSize) + vindex.bz;

            // get the noise for the provided BitVoxel at provided world coordinate
            const density: number = gen.getDensity(worldCoordBVX, worldCoordBVY, worldCoordBVZ);
            const height: number = gen.getHeight(worldCoordBVX, 0.0, worldCoordBVZ, 0, 8 * mapOffset);

            if (worldCoordBVY < height) {
                if (density > densityCheck) {
                    chunk.setBitVoxel(vindex);
                }
                else {
                    chunk.unsetBitVoxel(vindex);
                }
            }
            else {
                chunk.unsetBitVoxel(vindex);
            }
        }
    }
}