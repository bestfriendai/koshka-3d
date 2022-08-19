import { Euler, Quaternion, Vector3 } from "three";
import { Engine } from "../engine.js";
import { Prop } from "./prop.js";

export class PhysicsProp extends Prop {
    constructor(args) {
        super(args);

        this._data = {
            ...this._data,
            bodyTarget: Object.keys(this._children)[0],
            shapeType: `box`,
            kinematic: false,
            ignoreRotation: false,
            ccd: false,
            gravityScale: 1,
            mass: 0,
            radius: 0,
            halfHeight: 0.5,
            restitution: 0.25,
            linearDamping: 0,
            angularDamping: 0,
            offset: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            maxVelocity: new Vector3(30, 30, 30),
            enabledRotations: new Vector3(1, 1, 1),
            ...args,
        };

        this._body = undefined;
        this._collider = undefined;
        this.setBody(this._data.shapeType);
    }

    setBody(shapeType) {
        try {
            Engine.physics.removeCollider(this._collider);
            Engine.physics.removeRigidBody(this._body);
        } catch (error) {
            //
        }

        this._collider = undefined;
        this._body = undefined;
        const geometry = this._children[this._data.bodyTarget].geometry;
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();
        const boundingBox = geometry.boundingBox;
        const boundingSphere = geometry.boundingSphere;
        const size = new Vector3();
        boundingBox.getSize(size);
        const radius =
            this._data.radius !== 0 ? this._data.radius : boundingSphere.radius;
        const pos = this._data.position;
        const rot = this._root.quaternion;
        const ccd = this._data.ccd;
        const rotations = this._data.enabledRotations;
        const damping = this._data.linearDamping;
        const angDamping = this._data.angularDamping;
        const halfHeight = this._data.halfHeight;
        const mass = this._data.mass;
        const gravity = this._data.gravityScale;
        const RAPIER = Engine.RAPIER;
        const world = Engine.physics;
        let rigidBodyDesc = this._data.static
            ? RAPIER.RigidBodyDesc.fixed()
            : RAPIER.RigidBodyDesc.dynamic();
        rigidBodyDesc = this._data.kinematic
            ? RAPIER.RigidBodyDesc.kinematicVelocityBased()
            : rigidBodyDesc;
        rigidBodyDesc
            .setTranslation(pos.x, pos.y, pos.z)
            .setRotation(rot)
            .setCcdEnabled(ccd)
            .setLinearDamping(damping)
            .setAngularDamping(angDamping)
            .setAdditionalMass(mass)
            .setGravityScale(gravity);
        this._body = world.createRigidBody(rigidBodyDesc);
        this._body.setEnabledRotations(rotations.x, rotations.y, rotations.z);
        let colliderDesc = undefined;

        switch (shapeType) {
            case `box`:
                colliderDesc = this._createBoxCollider(size);

                break;

            case `sphere`:
                colliderDesc = this._createSphereCollider(radius);

                break;

            case `trimesh`:
                colliderDesc = this._createTrimeshCollider(geometry);

                break;

            case `capsule`:
                colliderDesc = this._createCapsuleCollider(halfHeight, radius);

                break;

            default:
                colliderDesc = this._createBoxCollider(size);

                break;
        }

        this._collider = world.createCollider(colliderDesc, this._body);
    }

    _createBoxCollider(size) {
        const RAPIER = Engine.RAPIER;

        return RAPIER.ColliderDesc.cuboid(size.x, size.y, size.z);
    }

    _createSphereCollider(radius) {
        const RAPIER = Engine.RAPIER;

        return RAPIER.ColliderDesc.ball(radius);
    }

    _createCapsuleCollider(halfHeight, radius) {
        const RAPIER = Engine.RAPIER;

        return RAPIER.ColliderDesc.capsule(halfHeight, radius);
    }

    _createTrimeshCollider(geometry) {
        const RAPIER = Engine.RAPIER;
        const verticesF32 = new Float32Array(
            geometry.attributes.position.array
        );
        const indicesU32 = new Uint32Array(geometry.index.array);

        return RAPIER.ColliderDesc.trimesh(verticesF32, indicesU32);
    }

    _destroy() {
        super._destroy();

        try {
            Engine.physics.removeCollider(this._collider);
            Engine.physics.removeRigidBody(this._body);
        } catch (error) {
            //
        }

        this._collider = undefined;
        this._body = undefined;
    }

    _update(delta) {
        super._update(delta);

        if (this.isNetworkOwner) {
            const rot = this._body.rotation();
            const pos = this._body.translation();
            const offset = this._data.offset;
            this.setPosition(
                pos.x + offset.x,
                pos.y + offset.y,
                pos.z + offset.z
            );

            if (!this._data.ignoreRotation) {
                const quat = new Quaternion(rot.x, rot.y, rot.z, rot.w);
                this._data.rotation.setFromQuaternion(quat);
            }
        } else {
            const euler = new Euler().copy(this._data.rotation);
            const rot = new Quaternion().setFromEuler(euler);
            this._body.setTranslation(this._data.position);
            this._body.setRotation(rot);
        }
    }

    get velocity() {
        return this._velocity;
    }

    set velocity(velocity) {
        this._velocity = velocity;
    }
}
