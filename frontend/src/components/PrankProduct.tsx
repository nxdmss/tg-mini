import {
  useEffect,
  useState,
} from "react";

import {
  isPrankLaughPlaying,
  onPrankLaughEnded,
  playPrankBoom,
  playPrankLaugh,
  PRANK_BOOM_GIF_SRC,
  PRANK_CAT_GIF_SRC,
  stopPrankAudio,
} from "../prank";

type PrankPhase =
  | "cat"
  | "boom";

export function PrankProduct({
  onBack,
}: {
  onBack: () => void;
}) {
  const [
    phase,
    setPhase,
  ] =
    useState<PrankPhase>(
      "cat",
    );

  useEffect(() => {
    setPhase("cat");

    const removeListener =
      onPrankLaughEnded(
        () => {
          setPhase(
            "boom",
          );

          void playPrankBoom();
        },
      );

    /*
     * Если товар был открыт
     * напрямую по ссылке,
     * пробуем запустить смех.
     *
     * При обычном клике
     * из каталога звук уже
     * запускается в App.tsx.
     */
    if (
      !isPrankLaughPlaying()
    ) {
      void playPrankLaugh();
    }

    return () => {
      removeListener();
      stopPrankAudio();
    };
  }, []);

  function close() {
    stopPrankAudio();
    onBack();
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",

        width: "100%",

        background:
          "#000",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        position:
          "relative",

        overflow:
          "hidden",

        boxSizing:
          "border-box",

        padding:
          "0",
      }}
    >
      <button
        type="button"
        onClick={
          close
        }
        aria-label="Назад"
        style={{
          position:
            "absolute",

          top: 20,
          left: 16,

          width: 48,
          height: 48,

          border:
            "1px solid rgba(255,255,255,0.3)",

          borderRadius:
            "50%",

          background:
            "rgba(0,0,0,0.45)",

          color:
            "#fff",

          fontSize:
            24,

          cursor:
            "pointer",

          zIndex:
            10,
        }}
      >
        ←
      </button>

      <img
        key={phase}
        src={
          phase ===
          "cat"
            ? PRANK_CAT_GIF_SRC
            : PRANK_BOOM_GIF_SRC
        }
        alt=""
        draggable={
          false
        }
        style={{
          display:
            "block",

          width:
            "100%",

          maxWidth:
            "600px",

          maxHeight:
            "100vh",

          objectFit:
            "contain",

          userSelect:
            "none",
        }}
      />
    </main>
  );
}