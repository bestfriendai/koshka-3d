import { v4 } from "uuid";

export function toRadians(deg) {
    return (deg * Math.PI) / 180;
}

export function toDegrees(rad) {
    return (rad * 180) / Math.PI;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function closestDivisible(value, divisible) {
    return Math.floor(value - (value % divisible));
}

export function lerp(start, end, amt) {
    const value = (1 - amt) * start + amt * end;

    return value;
}

export function generateUUID() {
    return v4();
}
