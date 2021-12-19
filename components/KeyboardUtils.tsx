import React, { useEffect, useRef, useState } from "react";

export const UseKeyboardPan = (cameraRef) => {
  const pressedRef = useRef<string[]>([]);

  useEffect(() => {
    const pressed = pressedRef.current;
    const camera = cameraRef.current;

    const discretePanCamera = (diff: Array<number>) => {
      const visibleHeight =
        2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const zoomPixel = visibleHeight / window.innerHeight;
      camera.position.x -= 16 * diff[0] * zoomPixel;
      camera.position.y += 16 * diff[1] * zoomPixel;
    };

    const discreteZoom = (change: number) => {
      const percent = (window.innerHeight - change) / window.innerHeight;
      camera.position.z = Math.min(
        32,
        Math.max(1, camera.position.z / percent)
      );
    };

    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === "-") {
        discreteZoom(32 * 2);
      } else if (press === "+" || press === "=") {
        discreteZoom(-32 * 2);
      }
      if (!pressed.includes(press)) {
        pressed.push(press);
      }
      if (pressed.includes("arrowleft") || pressed.includes("h")) {
        discretePanCamera([1 * 2, 0]);
      }
      if (pressed.includes("arrowright") || pressed.includes("l")) {
        discretePanCamera([-1 * 2, 0]);
      }
      if (pressed.includes("arrowup") || pressed.includes("k")) {
        if (e.shiftKey) {
          discreteZoom(32 * 2);
        } else {
          discretePanCamera([0, 1 * 2]);
        }
      }
      if (pressed.includes("arrowdown") || pressed.includes("j")) {
        if (e.shiftKey) {
          discreteZoom(-32 * 2);
        } else {
          discretePanCamera([0, -1 * 2]);
        }
      }
    };

    const upHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      const index = pressed.indexOf(press);
      if (index !== -1) {
        pressed.splice(index, 1);
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);
};
