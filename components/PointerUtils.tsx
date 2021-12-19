import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const UseWheelZoom = (rendererRef: any, cameraRef: any) => {
  const cameraDown = useRef(new THREE.Vector3());

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    const handleMousewheel = (e: WheelEvent) => {
      e.preventDefault();

      if (camera) {
        cameraDown.current.copy(camera.position);

        const percent =
          (window.innerHeight - e.deltaY * 2) / window.innerHeight;
        const nextZoom = Math.min(32, Math.max(1, camera.position.z / percent));

        const visibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDown.current.z;
        const zoomPixel = visibleHeight / window.innerHeight;
        const relx = e.clientX - window.innerWidth / 2;
        const rely = -(e.clientY - window.innerHeight / 2);
        const worldRelX = relx * zoomPixel;
        const worldRelY = rely * zoomPixel;

        const newVisibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * nextZoom;
        const newZoomPixel = newVisibleHeight / window.innerHeight;

        const newWorldX = relx * newZoomPixel;
        const newWorldY = rely * newZoomPixel;

        const diffX = newWorldX - worldRelX;
        const diffY = newWorldY - worldRelY;

        camera.position.x = cameraDown.current.x - diffX;
        camera.position.y = cameraDown.current.y - diffY;
        camera.position.z = nextZoom;
      }
    };

    if (renderer) {
      renderer.addEventListener("wheel", handleMousewheel, {
        passive: false,
      });
      return () => {
        renderer.removeEventListener("wheel", handleMousewheel);
      };
    }
  }, [rendererRef, cameraRef]);
};

export const UsePointerRay = (canvasRef: any, cameraRef: any) => {
  const initVectors = useMemo((): [THREE.Raycaster, THREE.Vector2] => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    return [raycaster, mouse];
  }, []);

  const [raycaster, mouse] = initVectors;
  useEffect(() => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;

    const handlePointerMove = (e: MouseEvent) => {
      e.preventDefault();

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
    };

    if (canvas) {
      canvas.addEventListener("pointermove", handlePointerMove);
      return () => {
        canvas.removeEventListener("pointermove", handlePointerMove);
      };
    }
  }, [raycaster, mouse, canvasRef, cameraRef, initVectors]);

  console.log(raycaster);
  return raycaster;
};

export const UsePointerPan = (rendererRef: any, cameraRef: any) => {
  const cameraDown = useRef(new THREE.Vector3());
  const diff = useRef(new THREE.Vector2());
  const pointersRef = useRef<any[]>([]);

  useEffect(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const pointers = pointersRef.current;

    if (!camera) return;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();

      pointers.push({
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        pointerDown: [e.clientX, e.clientY],
        primary: e.isPrimary,
      });
      for (const pointer of pointers) {
        pointer.pointerDown = [pointer.x, pointer.y];
      }
      cameraDown.current.copy(camera.position);

      renderer.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();

      if (pointers.length === 1) {
        const pointer = pointers[0];
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        const visibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDown.current.z;
        const zoomPixel = visibleHeight / window.innerHeight;
        diff.current.x = (e.clientX - pointer.pointerDown[0]) * zoomPixel;
        diff.current.y = (e.clientY - pointer.pointerDown[1]) * zoomPixel;
        camera.position.x = cameraDown.current.x - diff.current.x;
        camera.position.y = cameraDown.current.y + diff.current.y;
      } else if (pointers.length === 2) {
        const pointer = pointers.filter((p) => p.id === e.pointerId)[0];
        pointer.x = e.clientX;
        pointer.y = e.clientY;

        const a = pointers[0];
        const b = pointers[1];
        const minDown = [
          Math.min(a.pointerDown[0], b.pointerDown[0]),
          Math.min(a.pointerDown[1], b.pointerDown[1]),
        ];
        const maxDown = [
          Math.max(a.pointerDown[0], b.pointerDown[0]),
          Math.max(a.pointerDown[1], b.pointerDown[1]),
        ];
        const min = [Math.min(a.x, b.x), Math.min(a.y, b.y)];
        const max = [Math.max(a.x, b.x), Math.max(a.y, b.y)];
        const combined = {
          down: [
            minDown[0] + (maxDown[0] - minDown[0]) / 2,
            minDown[1] + (maxDown[1] - minDown[1]) / 2,
          ],
          current: [
            min[0] + (max[0] - min[0]) / 2,
            min[1] + (max[1] - min[1]) / 2,
          ],
        };

        const visibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDown.current.z;
        const zoomPixel = visibleHeight / window.innerHeight;

        const dragged = [
          (combined.current[0] - combined.down[0]) * zoomPixel,
          (combined.current[1] - combined.down[1]) * zoomPixel,
        ];

        const adjustedDown = new THREE.Vector3();
        adjustedDown.x = cameraDown.current.x - dragged[0];
        adjustedDown.y = cameraDown.current.y + dragged[1];

        const downDiff = Math.sqrt(
          Math.pow(a.pointerDown[0] - b.pointerDown[0], 2) +
            Math.pow(a.pointerDown[1] - b.pointerDown[1], 2)
        );
        const currDiff = Math.sqrt(
          Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
        );
        const percent = (currDiff - downDiff) / downDiff + 1;

        const relx = combined.current[0] - window.innerWidth / 2;
        const rely = -(combined.current[1] - window.innerHeight / 2);
        const worldRelX = relx * zoomPixel;
        const worldRelY = rely * zoomPixel;

        const nextZoom = Math.min(
          32,
          Math.max(1, cameraDown.current.z / percent)
        );

        const newVisibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * nextZoom;
        const newZoomPixel = newVisibleHeight / window.innerHeight;

        const newWorldX = relx * newZoomPixel;
        const newWorldY = rely * newZoomPixel;

        const diffX = newWorldX - worldRelX;
        const diffY = newWorldY - worldRelY;

        camera.position.x = adjustedDown.x - diffX;
        camera.position.y = adjustedDown.y - diffY;
        camera.position.z = nextZoom;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();

      pointers.splice(
        pointers.findIndex((p) => p.id === e.pointerId),
        1
      );
      for (const pointer of pointers) {
        pointer.pointerDown = [pointer.x, pointer.y];
      }

      cameraDown.current.copy(camera.position);

      renderer.releasePointerCapture(e.pointerId);
    };

    if (renderer) {
      renderer.addEventListener("pointerdown", handlePointerDown);
      renderer.addEventListener("pointermove", handlePointerMove);
      renderer.addEventListener("pointerup", handlePointerUp);
      return () => {
        renderer.removeEventListener("pointerdown", handlePointerDown);
        renderer.removeEventListener("pointermove", handlePointerMove);
        renderer.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [rendererRef, cameraRef]);
};
