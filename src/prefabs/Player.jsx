import { useSphere } from "@react-three/cannon";
import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Vector3 } from "three";
import { useKeyboardInput } from "../hooks/useKeyboardInput";
import { useMouseInput } from "../hooks/useMouseInput";
import { useVariable } from "../hooks/useVariable";
import { Bullet } from "./Bullet";
import { Raycaster } from "three";

const speed = 5;
const bulletSpeed = 35;
const bulletCoolDown = 300;
const jumpSpeed = 5;
const jumpCoolDown = 400;

export const Player = () => {
  // const cam = useRef();
  const [sphereRef, api] = useSphere(() => ({
    mass: 1,
    fixedRotation: true,
    position: [0, 100, 0],
    args: 0.1
    // material: {
    //   friction: 0
    // }
  }));
  const [bullets, setBullets] = useState([]);
  const pressed = useKeyboardInput(["w", "a", "s", "d", " "]);
  const pressedMouse = useMouseInput();

  const input = useVariable(pressed);
  const mouseInput = useVariable(pressedMouse);

  const { camera, scene } = useThree();

  const state = useRef({
    timeToShoot: 0,
    timeTojump: 0,
    vel: [0, 0, 0],
    jumping: false
  });

  useEffect(() => {
    api.velocity.subscribe((v) => (state.current.vel = v));
    // api.position.subscribe((p) => camera.position.clone(p));
  }, [api]);

  useFrame(() => {
    // camera.position.add(0.01, 0, 0);

    const { w, s, a, d } = input.current;
    const space = input.current[" "];

    let velocity = new Vector3(0, 0, 0);
    let cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);

    let forward = new Vector3();
    forward.setFromMatrixColumn(camera.matrix, 0);
    forward.crossVectors(camera.up, forward);

    let right = new Vector3();
    right.setFromMatrixColumn(camera.matrix, 0);

    let [horizontal, vertical] = [0, 0];

    if (w) {
      vertical += 1;
    }
    if (s) {
      vertical -= 1;
    }
    if (d) {
      horizontal += 1;
    }
    if (a) {
      horizontal -= 1;
    }

    if (horizontal !== 0 && vertical !== 0) {
      velocity
        .add(forward.clone().multiplyScalar(speed * vertical))
        .add(right.clone().multiplyScalar(speed * horizontal));
      velocity.clampLength(-5, 5);
    } else if (horizontal !== 0) {
      velocity.add(right.clone().multiplyScalar(speed * horizontal));
    } else if (vertical !== 0) {
      velocity.add(forward.clone().multiplyScalar(speed * vertical));
    }

    api.velocity.set(velocity.x, state.current.vel[1], velocity.z);
    // api.w

    // camera.matrix.copy(sphereRef.current.matrix);
    // camera.updateMatrix();

    // camera.position.set(

    // );

    if (state.current.jumping && state.current.vel[1] < 0) {
      const raycaster = new Raycaster(
        sphereRef.current.position,
        new Vector3(0, -1, 0),
        0,
        0.2
      );
      const intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length !== 0) {
        state.current.jumping = false;
      }
    }

    if (space && !state.current.jumping) {
      const now = Date.now();
      if (now > state.current.timeTojump) {
        state.current.timeTojump = now + jumpCoolDown;
        state.current.jumping = true;
        api.velocity.set(state.current.vel[0], jumpSpeed, state.current.vel[2]);
      }
    }

    const bulletDirection = cameraDirection.clone().multiplyScalar(bulletSpeed);
    const bulletPosition = camera.position
      .clone()
      .add(cameraDirection.clone().multiplyScalar(2));

    if (mouseInput.current.left) {
      const now = Date.now();
      if (now >= state.current.timeToShoot) {
        state.current.timeToShoot = now + bulletCoolDown;
        setBullets((bullets) => [
          ...bullets,
          {
            id: now,
            position: [bulletPosition.x, bulletPosition.y, bulletPosition.z],
            forward: [bulletDirection.x, bulletDirection.y, bulletDirection.z]
          }
        ]);
      }
    }
  });

  return (
    <>
      {/* <PerspectiveCamera ref={cam} makeDefault position={[0, 0, 12]} fov={50} /> */}
      <mesh ref={sphereRef}>
        {bullets.map((bullet) => {
          return (
            <Bullet
              key={bullet.id}
              velocity={bullet.forward}
              position={bullet.position}
            />
          );
        })}
        <primitive object={camera} dispose={null} />
        <sphereBufferGeometry args={[1, 32, 32]} />
        <meshPhongMaterial color={"hotpink"} />
      </mesh>
    </>
  );
};
