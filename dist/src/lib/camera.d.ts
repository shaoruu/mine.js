import Engine from '..';
export interface ICameraOptions {
    /**
     * @default false
     */
    inverseX: boolean;
    /**
     * @default false
     */
    inverseY: boolean;
    /**
     * @default 10
     */
    sensitivityX: number;
    /**
     * @default 10
     */
    sensitivityY: number;
    /**
     * @default 0
     */
    initialZoom: number;
    /**
     * @default 0.2
     */
    zoomSpeed: number;
}
/**
 * @typicalname noa.camera
 * @description Manages the camera, exposes camera position, direction, mouse sensitivity.
 */
export declare class Camera {
    constructor(noa: Engine, options: Partial<ICameraOptions>);
    noa: Engine;
    _dirVector: number[];
    /**
     * Current actual zoom distance. This differs from `zoomDistance` when
     * the camera is in the process of moving towards the desired distance,
     * or when it's obstructed by solid terrain behind the player.
     */
    currentZoom: number;
    /**
     * Entity ID of a special entity that exists for the camera to point at.
     *
     * By default this entity follows the player entity, so you can
     * change the player's eye height by changing the `follow` component's offset:
     * ```js
     * var followState = noa.ents.getState(noa.camera.cameraTarget, 'followsEntity')
     * followState.offset[1] = 0.9 * myPlayerHeight
     * ```
     *
     * For customized camera controls you can change the follow
     * target to some other entity, or override the behavior entirely:
     * ```js
     * // make cameraTarget stop following the player
     * noa.ents.removeComponent(noa.camera.cameraTarget, 'followsEntity')
     * // control cameraTarget position directly (or whatever..)
     * noa.ents.setPosition(noa.camera.cameraTarget, [x,y,z])
     * ```
     */
    cameraTarget: any;
    /** How quickly the camera moves to its `zoomDistance` (0..1) */
    zoomSpeed: number;
    /** How far back the camera is zoomed from the camera target */
    zoomDistance: number;
    /**
     * Horizontal mouse sensitivity.
     * Same scale as Overwatch (typical values around `5..10`)
     */
    sensitivityX: number;
    /**
     * Vertical mouse sensitivity.
     * Same scale as Overwatch (typical values around `5..10`)
     */
    sensitivityY: number;
    /** Mouse look inverse (horizontal) */
    inverseX: boolean;
    /** Mouse look inverse (vertical) */
    inverseY: boolean;
    /**
     * Camera yaw angle (read only)
     * Returns the camera's rotation angle around the vertical axis. Range: `0..2π`
     *
     * @default 0
     */
    heading: number;
    /**
     * Camera pitch angle (read only)
     *
     * Returns the camera's up/down rotation angle. Range: `-π/2..π/2`.
     * (The pitch angle is clamped by a small epsilon, such that
     * the camera never quite points perfectly up or down.
     *
     * @default 0
     */
    pitch: number;
    /**
     * Local position functions for high precision
     */
    _localGetTargetPosition: () => number[];
    _localGetPosition: () => number[];
    /**
     * Camera target position (read only)
     *
     * This returns the point the camera looks at - i.e. the player's
     * eye position. When the camera is zoomed
     * all the way in, this is equivalent to `camera.getPosition()`.
     */
    getTargetPosition: () => number[];
    /**
     * Returns the current camera position (read only)
     */
    getPosition: () => number[];
    /**
     * Returns the camera direction vector (read only)
     */
    getDirection: () => number[];
    /**
     * Called before render, if mouseLock etc. is applicable.
     * Consumes input mouse events x/y, updates camera angle and zoom
     */
    applyInputsToCamera: () => void;
    /**
     * Called before all renders, pre- and post- entity render systems
     */
    updateBeforeEntityRenderSystems: () => void;
    updateAfterEntityRenderSystems: () => void;
}
