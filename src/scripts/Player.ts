import { Mesh, Vector3, PhysicsAggregate, PhysicsMotionType,PhysicsShapeType, PhysicsPrestepType } from "@babylonjs/core";
import Ball from "./Ball";
import GameManager from "./GameManager";

export default class Player {
    private _mesh: Mesh;
    private _leftKeyDown = false;
    private _rightKeyDown = false;
    private _spaceKeyDown = false;
    private _shootKeyProcessed = false; 
    private _aggregate: PhysicsAggregate | null;
    private _moveSpeed = 2; // 移動速度
    private _boundaryMinZ = -169; // Z軸の最小値
    private _boundaryMaxZ = 192; // Z軸の最大値

    constructor(mesh: Mesh) {
        this._mesh = mesh;
        this._aggregate = null;
        const scene = this._mesh.getScene();
        
        try {
            this._aggregate = new PhysicsAggregate(
                this._mesh,
                PhysicsShapeType.BOX,
                { 
                    mass: 0,          
                    restitution: 1,   
                    friction: 0       
                },
                scene
            );
            this._aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
            this._aggregate.body.setPrestepType(PhysicsPrestepType.ACTION);
            this._aggregate.body.setAngularDamping(0);

        } catch (e) {
            console.error("Error creating physics for player:", e);
        }
    }

    public onStart(): void {
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }

    public onUpdate(): void {
        const gm = GameManager.instance as any;
        let running = true;
        if (gm) {
            if (typeof gm.isRunning === 'function') {
                running = gm.isRunning();
            } else {
                running = false;
            }
        }
        if (!running) {
            this._shootKeyProcessed = false;
            return;
        }

        if (this._leftKeyDown) {
            this._moveLeft();
        } 
        else if (this._rightKeyDown) {
            this._moveRight();
        }

        if (this._spaceKeyDown) {
            if(!this._shootKeyProcessed) {
                this._shoot();
                this._shootKeyProcessed = true;
            }
        }

    }

    private _onKeyDown = (ev: KeyboardEvent) => {
        if (ev.repeat) return;

        if (ev.key === "ArrowLeft") {
            this._leftKeyDown = true;
        }
        else if (ev.key === "ArrowRight") {
            this._rightKeyDown = true;
        }
        else if (ev.key === " " || ev.code === "Space") { 
            this._spaceKeyDown = true;
        }
    };

    private _onKeyUp = (ev: KeyboardEvent) => {
        if (ev.key === "ArrowLeft") {
            this._leftKeyDown = false;
        }
        else if (ev.key === "ArrowRight") {
            this._rightKeyDown = false;
        }
        else if (ev.key === " " || ev.code === "Space") {
            this._spaceKeyDown = false;
        }
    };

    private _moveRight(): void {
        // 右方向の移動量（-Z方向）
        const moveAmount = -this._moveSpeed;
        const nextZ = this._mesh.position.z + moveAmount;
        
        // 範囲内でのみ移動可能
        if (nextZ > this._boundaryMinZ && nextZ < this._boundaryMaxZ) {
            this._mesh.position.z += moveAmount;
        }
    }

    private _moveLeft(): void {
        // 左方向の移動量（+Z方向）
        const moveAmount = this._moveSpeed;
        const nextZ = this._mesh.position.z + moveAmount;
        
        // 範囲内でのみ移動可能
        if (nextZ > this._boundaryMinZ && nextZ < this._boundaryMaxZ) {
            this._mesh.position.z += moveAmount;
        }
    }

    private _shoot(): void {
        const offset = new Vector3(20, 3, 0); // プレイヤーの前方に配置
        const position = this._mesh.position.add(offset);
        if (!Ball.currentBall) {
            new Ball(this._mesh.getScene(), position);
        }
    }
}


