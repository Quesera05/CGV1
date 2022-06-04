import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { A, D, DIRECTIONS, S, W} from './KeyboardUtility.js';

export class Player {
    //3D WORLD
    orbitControl;
    camera;
    camera2;
    firstPerson = false;
    model;
    mixer;
    animationsMap = new Map(); // Walk, Run, Punch, OnHit, Death, Idle
    
    //GAME LOGIC
    rigidBody;
    spawnPoint = new THREE.Vector3(0, 0, 0);
    rayFloor;
    rayWall;

    onHit = false;
    onHitCounter = 0;
    death = false;
    win = false;
    ImSoUnstoppable = false;
    invincTimer = 0;
    
    //ANIMATION STATE
    currentAction = 'Idle';
    isAttacking = false;
    animTimer = 0;
    
    //TEMPORARY DATA
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();
    storedFall = 0;
    
    //CONSTANTS
    fadeDuration = 0.1;
    runVelocity = 10;
    walkVelocity = 5;
    invincCooldown = 5;
    lerp = (x, y, a) => x * (1 - a) + y * a;


    constructor(model, mixer, animationsMap, orbitControl, camera, camera2, rigidBody, rayFloor, rayWall) {
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.camera2 = camera2;

        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        var idle = this.animationsMap.get('Idle');
        idle.play();

        this.rigidBody = rigidBody;
        this.spawnPoint.x = rigidBody.translation().x;
        this.spawnPoint.y = rigidBody.translation().y;
        this.spawnPoint.z = rigidBody.translation().z;
        this.rayFloor = rayFloor;
        this.rayWall = rayWall;
    }

    update(world, delta, keysPressed, enemy) {
        var distance = this.model.position.distanceTo(enemy.model.position);
        if (enemy.isAttacking && enemy.animTimer >= 0.55 && enemy.animTimer <= 0.65 && distance <= 3 && this.onHit == false && this.ImSoUnstoppable==false) {
            this.onHit=true;
            this.onHitCounter = this.onHitCounter + 1;
            this.invincTimer = this.invincCooldown;                        //give player 5 seconds of invincibility after getting clapped
            this.ImSoUnstoppable = true;
        }
        if(this.onHitCounter>=3) {
            this.death = true;
        }

        if(this.win) {
            this.ImSoUnstoppable = true;
        }


        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true);
        const runKey = 'q';
        const punchKey = 'e';

        var play = 'Idle';                                             //if not about to punch        and    not currently punching
        if (directionPressed == true && keysPressed[runKey] == true && keysPressed[punchKey] == false && this.isAttacking==false) {
            play = 'Run';
        } 
        if (directionPressed == true && keysPressed[runKey] == false && keysPressed[punchKey] == false && this.isAttacking==false) {
            play = 'Walk';
        } 
        if (keysPressed[punchKey] == true || this.isAttacking==true) {
            play = 'Punch';
            this.isAttacking=true;
        } 
        if (directionPressed == false && keysPressed[runKey] == false && keysPressed[runKey] == false && this.isAttacking==false){
            play = 'Idle';
            this.isAttacking=false;
        }
        
        if (this.onHit) {
            play = 'OnHit';
            this.isAttacking=false;
        }
        if (this.death) {
            play = 'Death';
            this.isAttacking=false;
        }


        //if any animation is interrupted, blend it into the new animation
        if (this.currentAction != play) {
            const toPlay = this.animationsMap.get(play);
            const current = this.animationsMap.get(this.currentAction);

            current.fadeOut(this.fadeDuration);
            toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play;
        }

        //if punch animation active
        if (this.isAttacking==true) {
            //if punch in progress, do nothing
            if (this.animTimer < this.animationsMap.get('Punch').getClip().duration) {
                this.animTimer = this.animTimer + delta;
            }
            
            //punch done, swap to idle
            else {
                this.animTimer = 0;
                this.isAttacking=false;
                this.animationsMap.get('Punch').reset();
                
                const toPlay = this.animationsMap.get('Idle');
                const current = this.animationsMap.get('Punch');
                
                current.fadeOut(this.fadeDuration);
                toPlay.reset().fadeIn(this.fadeDuration).play();
                this.currentAction = 'Idle';
            }
        }

        //if player was hit
        if (this.currentAction=='OnHit') {
            //if onHit in progress, do nothing
            if (this.animTimer < this.animationsMap.get('OnHit').getClip().duration) {
                this.animTimer = this.animTimer + delta;
            }
            
            //onHit done, swap to idle
            else {
                this.animTimer = 0;
                this.onHit = false;
                this.animationsMap.get('OnHit').reset();
                
                const toPlay = this.animationsMap.get('Idle');
                const current = this.animationsMap.get('OnHit');
                
                current.fadeOut(this.fadeDuration);
                toPlay.reset().fadeIn(this.fadeDuration).play();
                this.currentAction = 'Idle';
            }
        }


        this.mixer.update(delta);
        
        this.invincTimer=this.invincTimer-delta;
        if(this.invincTimer<=0) {
            this.invincTimer=0;
            this.ImSoUnstoppable=false;
        }


        this.walkDirection.x = this.walkDirection.y = this.walkDirection.z = 0;
        var velocity = 0;
        if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
            //calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                    (-this.camera.position.x + this.model.position.x), 
                    (-this.camera.position.z + this.model.position.z));
            //diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed);

            //rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

            //calculate direction
            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

            //run/walk velocity
            if (this.currentAction=='Run') {
                velocity = this.runVelocity;
            }

            else {
                velocity = this.walkVelocity;
            }
        }

        const translation = this.rigidBody.translation();
        if (translation.y < -50) {
            //don't fall below certain height
            this.rigidBody.setNextKinematicTranslation({ 
                x: this.spawnPoint.x, 
                y: this.spawnPoint.y, 
                z: this.spawnPoint.z 
            });
        } 
        else {
            //update model and camera
            const cameraPositionOffset = this.camera.position.sub(this.model.position);
            this.model.position.x = translation.x;
            this.model.position.y = translation.y - 0.45;
            this.model.position.z = translation.z;
            this.updateCameraTarget(cameraPositionOffset);
    

            //ground collisions
            this.walkDirection.y += this.lerp(this.storedFall, -9.81 * delta, 0.10);
            this.storedFall = this.walkDirection.y;
            this.rayFloor.origin.x = translation.x;
            this.rayFloor.origin.y = translation.y;
            this.rayFloor.origin.z = translation.z;
            let hit = world.castRay(this.rayFloor, 0.5, false, 0xfffffffff);
            if (hit) {
                const point = this.rayFloor.pointAt(hit.toi);
                let diff = translation.y - ( point.y + 0.45);
                if (diff < 0.0) {
                    this.storedFall = 0;
                    this.walkDirection.y = this.lerp(0, Math.abs(diff), 0.5);
                }
            }


            //walk direction
            this.walkDirection.x = this.walkDirection.x * velocity * delta;
            this.walkDirection.z = this.walkDirection.z * velocity * delta;


            //wall collisions
            var walkDirection2 = this.walkDirection.clone();
            walkDirection2 = walkDirection2.normalize();
            this.rayWall.origin.x = translation.x;
            this.rayWall.origin.y = translation.y;
            this.rayWall.origin.z = translation.z;
            this.rayWall.dir.x = walkDirection2.x;
            this.rayWall.dir.y = 0;
            this.rayWall.dir.z = walkDirection2.z;

            let hitWall = world.castRay(this.rayWall, 0.5, false, 0xfffffffff);
            if (hitWall) {
                this.walkDirection.x = 0;
                this.walkDirection.z = 0;
            }


            //moving rigid body
            this.rigidBody.setNextKinematicTranslation({ 
                x: translation.x + this.walkDirection.x, 
                y: translation.y + this.walkDirection.y, 
                z: translation.z + this.walkDirection.z 
            });
        }
    }


    updateCameraTarget(offset) {
        //move camera
        this.camera.position.x = this.model.position.x + offset.x;
        this.camera.position.y = this.model.position.y + offset.y;
        this.camera.position.z = this.model.position.z + offset.z;

        //update camera target
        this.cameraTarget.x = this.model.position.x;
        if (this.firstPerson) {
            this.cameraTarget.y = this.model.position.y + 1.5;
        }
        else {
            this.cameraTarget.y = this.model.position.y + 1;
        }  
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget;

        this.camera2.position.set(this.model.position.x, 10, this.model.position.z);
        this.camera2.lookAt(this.model.position.x, this.model.position.y, this.model.position.z);
    }


    directionOffset(keysPressed) {
        var directionOffset = 0; // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // d
        }

        return directionOffset;
    }
}