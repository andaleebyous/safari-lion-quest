import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, GameCallbacks, GameHandle } from "@/game/scene";

type GameCanvasProps = GameCallbacks & {
  onReady: (handle: GameHandle) => void;
};

export default function GameCanvas({ onReady, ...callbacks }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current || !canvasRef.current) return;
    mountedRef.current = true;
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    let handle: GameHandle | null = null;
    let disposed = false;

    createGameScene(engine, canvas, callbacks).then((created) => {
      if (disposed) {
        created.dispose();
        return;
      }
      handle = created;
      onReady(created);
      engine.runRenderLoop(() => created.scene.render());
    });

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      handle?.dispose();
      engine.dispose();
      mountedRef.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="مشهد لعبة أسد في حديقة الحيوان" />;
}
