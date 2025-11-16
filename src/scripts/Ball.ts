import { Mesh, MeshBuilder, Scene, StandardMaterial, Color3, Vector3, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import GameManager from "./GameManager";

let ball: StandardMaterial | null = null;

export default class Ball {
    public static currentBall: Ball | null = null;
    public mesh: Mesh | null = null;
    private _aggregate: PhysicsAggregate | null = null;
    private _observerHandle: any = null;
    private _speed = 0;
    

    private _getLinearVelocity(): Vector3 | null {
        const bodyAny: any = this._aggregate?.body;
        if (!bodyAny) return null;
        if (typeof bodyAny.getLinearVelocity === 'function') return bodyAny.getLinearVelocity();
        return bodyAny.linearVelocity ?? null;
    }


    constructor(scene: Scene, position: Vector3) {
        try {
            this.mesh = MeshBuilder.CreateSphere("ball", { diameter: 10, segments: 8 }, scene);
            if (!ball) {
                ball = new StandardMaterial("ball-material", scene);
                ball.diffuseColor = new Color3(1, 0.3, 0);
                ball.emissiveColor = new Color3(0.7, 0.2, 0);
                ball.specularPower = 128;
            }
            this.mesh.material = ball;
            this.mesh.position.copyFrom(position);
            this._aggregate = new PhysicsAggregate(
                this.mesh,
                PhysicsShapeType.SPHERE,
                { 
                    mass: 0.1,
                    restitution: 1,
                    friction: 0.0
                },
                scene
            );
            this._aggregate.body.setGravityFactor(0);

            // 衝突コールバック有効化
            if (this._aggregate.body && this._aggregate.body.setCollisionCallbackEnabled) {
                this._aggregate.body.setCollisionCallbackEnabled(true);
            }

            if (this._aggregate.body) {
                const velocity = new Vector3(2000, 0, 2000);
                this._speed = velocity.length();
                this._aggregate.body.setLinearVelocity(velocity);

                try {
                    const observable = (this._aggregate.body as any).getCollisionObservable?.();
                    if (observable && typeof observable.add === 'function') {
                        observable.add((evt: any) => {
                            try {
                                const lv: any = this._getLinearVelocity();
                                if (!lv) return;

                                const bodyAny: any = this._aggregate?.body;
                                const desired = lv.scale(this._speed);
                                desired.y = 0;
                                bodyAny.setLinearVelocity(desired);
                            } catch (e) {
                                // defensive: ignore
                            }
                        });
                    }
                } catch (e) {
                    // ignore
                }
            } else {
                console.warn("[DEBUG] Ball PhysicsBody is missing!");
            }
            this._setupAutoCleanup(scene);
            Ball.currentBall = this;
        } catch (e) {
            console.error("Error creating ball:", e);
            this.dispose(scene);
        }
    }

    public dispose(scene: Scene) {
        try {
            if (this._observerHandle) {
                scene.onBeforeRenderObservable.remove(this._observerHandle);
                this._observerHandle = null;
            }
            // no physics observers to remove (debug observers removed)
            if (this._aggregate) {
                this._aggregate.dispose();
                this._aggregate = null;
            }
            if (this.mesh) {
                this.mesh.dispose();
                this.mesh = null;
            }
            if ((Ball.currentBall as Ball | null) === this) {
                Ball.currentBall = null;
            }
        } catch (e) {
            console.error("Error disposing ball:", e);
        }
    }



    private _setupAutoCleanup(scene: Scene): void {
        this._observerHandle = scene.onBeforeRenderObservable.add(() => {
            if (!this.mesh) return;
            if (Math.abs(this.mesh.position.x) > 500 || Math.abs(this.mesh.position.z) > 500) {
               
                try {
                    GameManager.instance?.showMessage("Gameover. Press Enter Key Again");
                    if (GameManager.instance && typeof (GameManager.instance as any).setAwaitingRestart === 'function') {
                        (GameManager.instance as any).setAwaitingRestart(true);
                    }
                } catch (e) {
                    // ignore
                }
                this.dispose(scene);
            }
        });
    }
}