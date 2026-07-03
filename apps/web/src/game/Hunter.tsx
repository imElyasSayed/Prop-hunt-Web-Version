// AI Hunter: frozen during prep, then patrols. Detects the player only when
// they are in its view cone AND poorly camouflaged (or taunting). Suspicion
// ramps with mismatch; a filled meter within tag range = splatted.
"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";
import { useModel } from "./models";
import { shared } from "./shared";
import { scoreCamo } from "./camo";
import { collide } from "./collision";
import { spotted as spottedSfx } from "./sound";
import {
  seeker,
  computeEscalation,
  INSPECT_TIME,
  INSPECT_TRIGGER_DIST,
  INSPECT_SUSPICION_LO,
  INSPECT_COOLDOWN,
  ESCALATION_RANGE_BONUS,
  ESCALATION_SUSPICION_BONUS,
  HARD_REVEAL_AT,
} from "./seeker";
import {
  HUNTER_SPEED,
  HUNTER_VIEW_RANGE,
  HUNTER_FOV_DOT,
  HUNTER_TAG_RANGE,
  HUNTER_SUSPICION_TO_TAG,
  CAMO_SAFE_THRESHOLD,
  HUNT_SECONDS,
} from "./constants";

const UP = new THREE.Vector3(0, 1, 0);

// Patrol points in OPEN floor — kept clear of every prop footprint so the
// Hunter can always reach them (a waypoint inside a prop = permanent stall).
const WAYPOINTS: [number, number][] = [
  [-4, -2],
  [4, -2],
  [8, -1],
  [4, 3],
  [-3, 3],
  [0, -8],
  [-4, 2],
];

export function Hunter() {
  const group = useRef<THREE.Group>(null);
  const dir = useRef(new THREE.Vector3(0, 0, 1));
  const suspicion = useRef(0);
  const stuckTime = useRef(0);
  const wp = useRef(0);
  const lastSeen = useRef(new THREE.Vector3(0, 0.6, 6));

  const phase = useGame((s) => s.phase);
  const splat = useGame((s) => s.splatPlayer);
  const setWatched = useGame((s) => s.setWatched);
  const hunterObj = useModel("blob_hunter");

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05); // clamp huge frames

    if (phase !== "hunt") {
      // frozen at spawn during prep/menu/result
      shared.hunterPos.copy(g.position);
      return;
    }

    const pos = g.position;
    const toPlayer = new THREE.Vector3().subVectors(shared.playerPos, pos);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const toNorm = toPlayer.clone().normalize();

    // --- Escalation Clock: scan intensifies as the round timer drains ---
    const survivedFor = useGame.getState().survivedFor;
    const esc = computeEscalation(survivedFor);
    seeker.escalation = esc;
    const viewRange = HUNTER_VIEW_RANGE * (1 + ESCALATION_RANGE_BONUS * esc);
    const remaining = HUNT_SECONDS - survivedFor;
    // Hard end-of-round reveal — guarantees resolution, no unfindable stalemate.
    seeker.hardReveal = remaining <= HARD_REVEAL_AT;

    // tick Second Look timers
    seeker.inspectCooldown = Math.max(0, seeker.inspectCooldown - dt);

    const inCone =
      dist < viewRange && dir.current.dot(toNorm) > HUNTER_FOV_DOT;
    const camo = scoreCamo(
      shared.playerColor,
      shared.coverage,
      shared.nearestSurfaceColor,
    );
    const detectable = camo < CAMO_SAFE_THRESHOLD || shared.taunting || seeker.hardReveal;
    const watched = (inCone && detectable) || (seeker.hardReveal && dist < viewRange);

    setWatched(watched);

    // --- Second Look: commit to a close inspect on a mid-confidence read ---
    if (seeker.inspecting) {
      seeker.inspectLeft -= dt;
      if (seeker.inspectLeft <= 0) {
        // resolve the inspect
        const stillOff = camo < CAMO_SAFE_THRESHOLD || shared.taunting || seeker.hardReveal;
        if (stillOff && dist < HUNTER_TAG_RANGE + 0.4) {
          seeker.lastInspect = "correct";
          seeker.lastInspectAt = survivedFor;
          suspicion.current = 1; // correct read → catch (tag resolves below)
        } else {
          seeker.lastInspect = "wrong"; // you held still and blended
          seeker.lastInspectAt = survivedFor;
          suspicion.current = Math.min(suspicion.current, 0.2);
          seeker.inspectCooldown = INSPECT_COOLDOWN; // penalty buys you time
        }
        seeker.inspecting = false;
      }
      // frozen while inspecting: face the player, don't move, then tag check
      dir.current.lerp(toNorm, 0.2).normalize();
      g.rotation.y = Math.atan2(dir.current.x, dir.current.z);
      shared.hunterPos.copy(pos);
      shared.hunterDir.copy(dir.current);
      if (suspicion.current >= 1 && dist < HUNTER_TAG_RANGE) splat();
      return;
    }

    // --- suspicion ---
    if (watched) {
      const mismatch = shared.taunting || seeker.hardReveal
        ? 1
        : Math.max(0.15, (CAMO_SAFE_THRESHOLD - camo) / CAMO_SAFE_THRESHOLD);
      const rate = 1 + ESCALATION_SUSPICION_BONUS * esc;
      suspicion.current = Math.min(
        1,
        suspicion.current + (mismatch * rate * dt) / HUNTER_SUSPICION_TO_TAG,
      );
      lastSeen.current.copy(shared.playerPos);
    } else {
      suspicion.current = Math.max(0, suspicion.current - dt * 0.4);
    }

    // trigger a Second Look when close with a mid-confidence read
    if (
      !seeker.hardReveal &&
      seeker.inspectCooldown <= 0 &&
      watched &&
      dist < INSPECT_TRIGGER_DIST &&
      suspicion.current >= INSPECT_SUSPICION_LO &&
      suspicion.current < 1
    ) {
      seeker.inspecting = true;
      seeker.inspectLeft = INSPECT_TIME;
      spottedSfx();
    }

    // --- decide target ---
    const chasing = suspicion.current > 0.05 && (watched || suspicion.current > 0.3);
    let target: THREE.Vector3;
    if (chasing) {
      target = watched ? shared.playerPos : lastSeen.current;
    } else {
      const [wx, wz] = WAYPOINTS[wp.current];
      target = new THREE.Vector3(wx, 0.6, wz);
      if (Math.hypot(pos.x - wx, pos.z - wz) < 1.2) {
        wp.current = (wp.current + 1) % WAYPOINTS.length;
        stuckTime.current = 0;
      }
    }

    // --- move toward target, steering around obstacles when blocked ---
    const desired = new THREE.Vector3().subVectors(target, pos);
    desired.y = 0;
    if (desired.length() > 0.05) {
      desired.normalize();
      // when stuck, rotate the *movement* dir to slide around the prop (wall-follow);
      // widen the angle and wiggle sides the longer we've been blocked.
      const moveDir = desired.clone();
      if (stuckTime.current > 0.3) {
        const ang = stuckTime.current > 1 ? Math.PI / 2 : Math.PI / 3;
        const side = Math.floor(stuckTime.current * 1.5) % 2 === 0 ? 1 : -1;
        moveDir.applyAxisAngle(UP, ang * side);
      }
      // face the target (not the sidestep) so it still looks like it's hunting
      dir.current.lerp(desired, 0.12).normalize();
      const speed = watched ? HUNTER_SPEED * 1.15 : HUNTER_SPEED;
      const step = speed * dt;
      const [cx, cz] = collide(pos.x + moveDir.x * step, pos.z + moveDir.z * step, 0.62);
      const moved = Math.hypot(cx - pos.x, cz - pos.z);
      pos.x = cx;
      pos.z = cz;
      // track blockage: little progress while trying to move == stuck
      if (moved < step * 0.4) stuckTime.current += dt;
      else stuckTime.current = Math.max(0, stuckTime.current - dt * 2);
      // if patrolling and still wedged, abandon this waypoint
      if (!chasing && stuckTime.current > 1.5) {
        wp.current = (wp.current + 1) % WAYPOINTS.length;
        stuckTime.current = 0;
      }
    } else {
      stuckTime.current = 0;
    }
    g.rotation.y = Math.atan2(dir.current.x, dir.current.z);

    shared.hunterPos.copy(pos);
    shared.hunterDir.copy(dir.current);

    // --- tag ---
    if (suspicion.current >= 1 && dist < HUNTER_TAG_RANGE) {
      splat();
    }
  });

  return (
    <group ref={group} position={[0, 0, -9]}>
      <primitive object={hunterObj} />
    </group>
  );
}
