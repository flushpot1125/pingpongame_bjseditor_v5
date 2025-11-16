import { Scene, MeshBuilder, Vector3, StandardMaterial, Color3, PhysicsAggregate, PhysicsShapeType, Mesh, PhysicsMotionType, PhysicsPrestepType } from "@babylonjs/core";
import GameManager from "./GameManager";

export default class BlockManager {
    public static instance: BlockManager | null = null;
    private _scene: Scene;
    private _mesh: Mesh;
    private _blocks: Array<{ mesh: Mesh; aggregate: PhysicsAggregate | null; marked?: boolean }> = [];
    private _removalScheduled = false;

    constructor(mesh: any) {
    this._mesh = mesh as Mesh;
    this._scene = this._mesh.getScene();
        BlockManager.instance = this;
        this._createBlocks();
    }

    public resetBlocks(): void {
        for (const b of this._blocks) {
            b.aggregate?.dispose();
            b.mesh?.dispose();
        }
        this._blocks.length = 0;
        this._createBlocks();
    }

    private _createBlocks(): void {
        const rows = 2;
        const columns = 4;
        const blockWidth = 40;
        const blockHeight = 10;
        const blockDepth = 70;
        const spacingX = 50;
        const spacingZ = 100;
        const startX = 162;
        const startY = 14;
        const startZ = 162;

        const blockMaterial = new StandardMaterial("blockMaterial", this._scene);
        blockMaterial.diffuseColor = new Color3(0.2, 0.4, 0.8);
        blockMaterial.specularColor = new Color3(0.3, 0.3, 0.3);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const xPos = startX - row * spacingX;
                const yPos = startY;
                const zPos = startZ - col * spacingZ;

                const blockId = `block-${row}-${col}`;
                const block = MeshBuilder.CreateBox(
                    blockId,
                    { width: blockWidth, height: blockHeight, depth: blockDepth },
                    this._scene
                );

                block.position = new Vector3(xPos, yPos, zPos);
                block.material = blockMaterial;

                const aggregate = new PhysicsAggregate(
                    block,
                    PhysicsShapeType.BOX,
                    { mass: 0.0, restitution: 1.0, friction: 0.0 },
                    this._scene
                );
                //この組み合わせにしないと、弾性衝突しなかった
                aggregate.body.setMotionType(PhysicsMotionType.STATIC);
                aggregate.body.setPrestepType(PhysicsPrestepType.ACTION);

                this._blocks.push({ mesh: block, aggregate });

                const observable = (aggregate.body as any).getCollisionObservable?.();
                if (observable && typeof observable.add === "function") {
                    const observer = observable.add((collisionEvent: any) => {
                        GameManager.instance?.setBlockCount(1);

                        try { observable.remove(observer); } catch { /* ignore */ }

                        const found = this._blocks.find(b => b.mesh === block);
                        if (found) {
                            found.marked = true;
                        } else {
                            this._blocks.push({ mesh: block, aggregate, marked: true });
                        }

                        //生成AIで作成。 このネスト呼び出しによって2フレーム待ってから削除処理(_processPendingRemoval())を実行しないと、Ballの衝突でブロックが消えなかった
                        if (!this._removalScheduled) {
                            this._removalScheduled = true;
                            requestAnimationFrame(() => requestAnimationFrame(() => {
                                this._processPendingRemovals();
                                this._removalScheduled = false;
                            }));
                        }

                    });
                }
            }
        }
    }

    public dispose(): void {
        for (const b of this._blocks) {
            b.aggregate?.dispose();
            b.mesh?.dispose();
        }
        this._blocks.length = 0;
    }

    private _processPendingRemovals(): void {
        const toRemove = this._blocks.filter(b => b.marked);
        if (toRemove.length === 0) return;

        this._blocks = this._blocks.filter(b => !b.marked);

        for (const entry of toRemove) {
            entry.aggregate?.dispose();
            entry.mesh?.dispose();
        }
    }
}
