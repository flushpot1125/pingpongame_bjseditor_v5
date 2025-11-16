import { Scene, Mesh } from "@babylonjs/core";
import {AdvancedDynamicTexture,TextBlock,StackPanel} from "@babylonjs/gui";
import Ball from "./Ball";
import BlockManager from "./BlockManager";

export default class GameManager {

	private _scene: Scene;
	private _mesh: Mesh;
    private  _totalBlocks: number = 8;
    public _gameMessageControl: TextBlock | null=null;
    private _numberOfUnCollideBlocks: number = 8;

    // singleton instance (set in onStart)
    public static instance: GameManager | null = null;
	public _blockCountText: TextBlock | null = null;


	constructor(mesh: any) {
		this._mesh = mesh as Mesh;
        this._scene = this._mesh.getScene();

    }

    public onStart(): void {
        GameManager.instance = this;
        console.log("[GameManager] onStart - instance registered", this);
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const stackPanel = new StackPanel();
        stackPanel.height = "100%";
        stackPanel.width = "100%";
        stackPanel.top = "100px";
        stackPanel.verticalAlignment = 0;
        playerUI.addControl(stackPanel);

        // Create start game text
        this._gameMessageControl = new TextBlock();
        this._gameMessageControl.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        this._gameMessageControl.fontSize = "48px";
        this._gameMessageControl.color = "white";
        this._gameMessageControl.text = "Please Press Enter Key to Start";
        this._gameMessageControl.resizeToFit = true;
        this._gameMessageControl.height = "80px";
        this._gameMessageControl.width = "600px";
        this._gameMessageControl.fontFamily ="Viga";
        playerUI.addControl(this._gameMessageControl);

        

        this._blockCountText = new TextBlock();
        this._blockCountText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        this._blockCountText.fontSize = "48px";
        this._blockCountText.color = "white";
        this._blockCountText.text = "blocks 8/8";
        this._blockCountText.resizeToFit = true;
        this._blockCountText.height = "96px";
        this._blockCountText.width = "220px";
        this._blockCountText.fontFamily = "Viga";
        stackPanel.addControl(this._blockCountText);

        // listen for Enter key to start/restart
        window.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                if (this._awaitingRestart) {
                    this.resetGame();
                } else if (!this._running) {
                    this.startGame();
                }
            }
        });
    }
    public onDispose(): void {
        if (GameManager.instance === this) GameManager.instance = null;
        console.log("[GameManager] onDispose - instance cleared");
    }


    public setBlockCount(count: number): void {
        this._numberOfUnCollideBlocks -= count;

        const total = this._totalBlocks;
        if (this._blockCountText) {
            this._blockCountText.text = `blocks ${this._numberOfUnCollideBlocks}/${total}`;
        }

        if (this._numberOfUnCollideBlocks <= 0) {
            this.showMessage("Congratuation! Please Press Enter Key to Restart");
            this._awaitingRestart = true;
            this._running = false;
            
            try {
                if (Ball.currentBall) {
                    Ball.currentBall.dispose(this._scene);
                    Ball.currentBall = null;
                }
            } catch (e) { /* ignore */ }
        }
    }

    public showMessage(message: string): void {
        if (this._gameMessageControl) {
            this._gameMessageControl.text = message;
        }
    }

    public setAwaitingRestart(flag: boolean): void {
        this._awaitingRestart = flag;
        this._running = !flag;
    }

    private _running: boolean = false;
    private _awaitingRestart: boolean = false;

    public startGame(): void {
        this._running = true;
        this._awaitingRestart = false;
        if (this._gameMessageControl) this._gameMessageControl.text = "";
    }

    public isRunning(): boolean { return this._running; }

    public resetGame(): void {
        try {
            if (Ball.currentBall) {
                try { Ball.currentBall.dispose(this._scene); } catch (e) { /* ignore */ }
                Ball.currentBall = null;
            }
        } catch (e) { /* ignore */ }

        try { BlockManager.instance?.resetBlocks(); } catch (e) { /* ignore */ }

    this._numberOfUnCollideBlocks = this._totalBlocks;
    this.setBlockCount(0);

    if (this._gameMessageControl) this._gameMessageControl.text = "";
    this._awaitingRestart = false;
    this._running = true;
    }


}