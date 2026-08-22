import { useEffect } from "react";

import {
  playPrankSound,
  stopPrankSound,
} from "../prank";

export function PrankProduct({
  onBack,
}: {
  onBack: () => void;
}) {
  useEffect(() => {
    return () => {
      stopPrankSound();
    };
  }, []);

  function close() {
    stopPrankSound();
    onBack();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px 40px",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Назад"
        style={{
          position: "absolute",
          top: 20,
          left: 16,
          width: 48,
          height: 48,
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        ←
      </button>

      <div
        style={{
          width: "min(100%, 430px)",
        }}
      >
        <video
          src="/prank/cat.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            width: "100%",
            display: "block",
            borderRadius: 18,
            objectFit: "cover",
          }}
        />

        <div
          style={{
            marginTop: 22,
            fontSize: "clamp(28px, 8vw, 54px)",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          АХАХАХА 😹
        </div>

        <button
          type="button"
          onClick={() => {
            void playPrankSound();
          }}
          style={{
            marginTop: 22,
            width: "100%",
            minHeight: 52,
            border: "1px solid #fff",
            borderRadius: 12,
            background: "#fff",
            color: "#000",
            font: "inherit",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ЕЩЁ РАЗ 🔊
        </button>
      </div>
    </main>
  );
}
