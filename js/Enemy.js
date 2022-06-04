import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class Enemy {
    //3D WORLD
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
    ImSoUnstoppable = false;
    
    //ANIMATION STATE
    currentAction = 'Idle';
    isAttacking = false;
    animTimer = 0;
    
    //TEMPORARY DATA
    walkDirection = new THREE.Vector3(0, 0, 1);
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();
    storedFall = 0;
    
    //CONSTANTS
    fadeDuration = 0.1;
    walkVelocity = 6;
    lerp = (x, y, a) => x * (1 - a) + y * a;


    constructor(model, mixer, animationsMap, rigidBody, rayFloor, rayWall) {
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

    update(world, delta, player) {
        var distance = this.model.position.distanceTo(player.model.position);
        if (player.isAttacking && player.animTimer >= 0.35 && player.animTimer <= 0.45 && distance <= 2 && this.onHit == false) {
            this.onHit=true;
            this.onHitCounter = this.onHitCounter + 1;
        }
        if(this.onHitCounter>=5) {
            this.death = true;
        }

        var play = 'Idle';
        if (distance < 15 && this.isAttacking==false) {
            play = 'Walk';
        } 
        if (distance <= 2.5 || this.isAttacking==true) {
            play = 'Slash';
            this.isAttacking=true;
        } 
        if (distance >= 15 && this.isAttacking==false){
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

        //if slash animation active
        if (this.isAttacking==true) {
            //if slash in progress, do nothing
            if (this.animTimer < this.animationsMap.get('Slash').getClip().duration) {
                this.animTimer = this.animTimer + delta;
            }
            
            //slash done, swap to idle
            else {
                this.animTimer = 0;
                this.isAttacking=false;
                this.animationsMap.get('Slash').reset();
                
                const toPlay = this.animationsMap.get('Idle');
                const current = this.animationsMap.get('Slash');
                
                current.fadeOut(this.fadeDuration);
                toPlay.reset().fadeIn(this.fadeDuration).play();
                this.currentAction = 'Idle';
            }
        }


        //if hit
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



        this.walkDirection = new THREE.Vector3(0, 0, 1);
        var velocity = 0;
        if (this.currentAction=='Walk' || this.currentAction=='Idle' || this.currentAction=='Slash') {
            //rotate model
            var angleYPlayerDirection = Math.atan2(
            (player.model.position.x - this.model.position.x), 
            (player.model.position.z - this.model.position.z))
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYPlayerDirection);
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

            //calculate direction
            this.walkDirection.applyQuaternion(this.rotateQuarternion);

            //walk velocity
            if (this.currentAction=='Walk') {
                velocity = this.walkVelocity;
            }
        }
        
        const translation = this.rigidBody.translation();
        if (translation.y < -50) {
            // don't fall below a certain height
            this.rigidBody.setNextKinematicTranslation({ 
                x: this.spawnPoint.x, 
                y: this.spawnPoint.y, 
                z: this.spawnPoint.z 
            });
        }
        else {
            //update model
            this.model.position.x = translation.x;
            this.model.position.y = translation.y - 0.45;
            this.model.position.z = translation.z;
    

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


}