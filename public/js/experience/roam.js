// public/js/experience/roam.js
export function initRoam() {
  const roam = {
    angle: 0,
    rotateBy(dx) {
      // dx pixels -> radians
      roam.angle += dx * 0.004;
    },
  };
  return roam;
}
