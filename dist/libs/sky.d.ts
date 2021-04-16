import { Mesh, ShaderMaterial, SphereGeometry } from 'three';
declare type SkyOptionsType = {
    domeOffset: number;
    dimension: number;
    topColor: string;
    bottomColor: string;
};
declare class Sky {
    options: SkyOptionsType;
    geometry: SphereGeometry;
    material: ShaderMaterial;
    mesh: Mesh;
    constructor(options?: Partial<SkyOptionsType>);
}
export { Sky };
