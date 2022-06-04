//(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import {EffectComposer} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/RenderPass.js';
import {OutlinePass} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/OutlinePass.js';
import {GlitchPass} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/GlitchPass.js';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

import {KeyDisplay} from '/js/KeyboardUtility.js';
import {Player} from '/js/Player.js';
import {Enemy} from '/js/Enemy.js';


export function Level0(){
    RAPIER.init().then(() => {
        Level0Init();
    });

}
function Level0Init() {
    //INIT UI ELEMENTS
    var ps = document.getElementById('Pause');
    ps.textContent = "";
    var lt = document.getElementById('LevelTimer');
    lt.textContent = "";
    const dub = document.getElementById('Win');
    dub.textContent = "";
    const loss = document.getElementById('Lose');
    loss.textContent = "";


    //TIMER
    var timeLeft = 180;
    var str = "Time remaining: " + timeLeft;
    lt.textContent = str;
    
    function decrementSeconds(){
        timeLeft = timeLeft - 1;
        str = "Time remaining: " + timeLeft;
        lt.textContent = str;
    }
    var intervalID;
    function startLevelTimer() {
        intervalID = setInterval(decrementSeconds, 1000);
    }
    function stopLevelTimer(){
        clearInterval(intervalID);
    }

    //INIT PHYSICS
    var gravity = { x: 0.0, y: -9.81, z: 0.0 };
    var world = new RAPIER.World(gravity);
    
    
    
    //SCENE
    const scene = new THREE.Scene();
    //Skybox
    const loaderSky = new THREE.CubeTextureLoader();
    loaderSky.setPath('./Resources/textures/skyboxes/heaven/');
    const texture = loaderSky.load([
        'ft.jpg',
        'bk.jpg',
        'up.jpg',
        'dn.jpg',
        'rt.jpg',
        'lf.jpg',
    ]);
    scene.background = texture;


    //CAMERA
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    //camera.position.set(0, 5, 6);                                //player
    //camera.position.set(0, 150, 0);                            //level editing

    //RENDERER
    //var options = { antialias: true };
    var options = { antialias: false };
    const renderer = new THREE.WebGLRenderer(options);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio/* *0.8 */);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;            //leave commented for better perf

    //CONTROLS
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;                          //leave commented
    orbitControls.enablePan = false;                             //and set
    orbitControls.maxPolarAngle = Math.PI/1.9;                   //player rigid body
    orbitControls.minDistance = 6;                               //at origin    
    orbitControls.maxDistance = 6;                               //for level editing                
    orbitControls.update();


    //LIGHTS minimap


    
    //MINIMAP
    const camera2 = new THREE.OrthographicCamera(-10, 10, 10, -10, 0, 100);
    camera2.position.set(0, 20, 0);
    camera2.lookAt(0, 0, 0);
    const renderer2 = new THREE.WebGLRenderer();
    renderer2.setSize(200, 200);
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = '70%';
    renderer2.domElement.style.left = '85%';

    const composer = new EffectComposer(renderer2);
    const renderPass = new RenderPass(scene, camera2);
    composer.addPass(renderPass);
    const glitchPass = new GlitchPass();
    composer.addPass(glitchPass);



    //LIGHTS
    mainLighting();



    //OBJECTS
    var rigidBodies = [];  //contains dynamic rigid bodies whose mesh needs to be updated


    //ramp
    const sandTextureLoader = new THREE.TextureLoader();
    const sandTexture = sandTextureLoader.load("./resources/textures/floors/ground_sand.jpg");
    
    const WIDTH = 10;
    const HEIGHT = 1;
    const LENGTH = 40;
    const geomRamp = new THREE.BoxGeometry(WIDTH, HEIGHT, LENGTH);
    const matRamp = new THREE.MeshStandardMaterial({ map: sandTexture });
    wrapAndRepeatTextureRamp(matRamp.map);

    //mesh
    const meshRamp = new THREE.Mesh(geomRamp, matRamp);
    meshRamp.position.set(0, -6.5, -69);
    meshRamp.rotation.set(-Math.PI/12, 0, 0);
    meshRamp.receiveShadow = true;
    scene.add(meshRamp);
    
    //rigid body
    var bodyDescRamp = RAPIER.RigidBodyDesc.fixed();
    bodyDescRamp.setCanSleep(true);
    bodyDescRamp.setTranslation(meshRamp.position.x, meshRamp.position.y, meshRamp.position.z);
    const quatRamp = new THREE.Quaternion().setFromEuler( new THREE.Euler(-Math.PI/12, 0, 0, 'XYZ') );
    bodyDescRamp.setRotation({ x: quatRamp.x, y: quatRamp.y, z: quatRamp.z, w: quatRamp.w });
    const rigidRamp = world.createRigidBody(bodyDescRamp);
    var colliderRamp = RAPIER.ColliderDesc.cuboid(WIDTH*0.5, HEIGHT*0.5, LENGTH*0.5);
    world.createCollider(colliderRamp, rigidRamp);


    //arena
    //mesh
    const geomCyl = new THREE.CylinderGeometry(20, 20, 1, 32);
    const matCyl = matRamp;
    const meshCyl = new THREE.Mesh(geomCyl, matCyl);
    meshCyl.position.set(0, -11, -105);
    scene.add( meshCyl );
    
    //rigid body
    var bodyDescCyl = RAPIER.RigidBodyDesc.fixed();
    bodyDescCyl.setCanSleep(true);
    bodyDescCyl.setTranslation(meshCyl.position.x, meshCyl.position.y, meshCyl.position.z);
    const rigidCyl = world.createRigidBody(bodyDescCyl);
    var colliderCyl = RAPIER.ColliderDesc.cylinder(1*0.5, 20);
    world.createCollider(colliderCyl, rigidCyl);


    //falling ball
    //mesh
    // const ballGeom = new THREE.SphereGeometry(1, 32, 32);
    // const ballMat = new THREE.MeshStandardMaterial({ color: 'red' });
    // var meshBall = new THREE.Mesh(ballGeom, ballMat);
    // meshBall.position.set(0, 8, 35);
    // meshBall.castShadow = true;
    // scene.add(meshBall);

    //rigid body
    // var bodyDescBall = RAPIER.RigidBodyDesc.dynamic().setTranslation(meshBall.position.x, meshBall.position.y, meshBall.position.z);
    // var rigidBall = world.createRigidBody(bodyDescBall);
    // var colliderBall = RAPIER.ColliderDesc.ball(1);
    // world.createCollider(colliderBall, rigidBall);
    // rigidBodies.push({ mesh: meshBall, rigid: rigidBall});


    //Floor
    floor();


    //Walls
    //texture
    const textureLoader = new THREE.TextureLoader();
    const brick = textureLoader.load("./resources/textures/walls/brick_medieval.jpg");
    const materialWall = new THREE.MeshStandardMaterial({ map: brick, side: THREE.DoubleSide });
    wrapAndRepeatTextureWall(materialWall.map);

    //maze walls
    //outer
    wall(new THREE.Vector3(-50, 0, -50), new THREE.Vector3(-5, 10, -49));
    wall(new THREE.Vector3(5, 0, -50), new THREE.Vector3(50, 10, -49));
    wall(new THREE.Vector3(50, 0, -49), new THREE.Vector3(49, 10, 50));
    wall(new THREE.Vector3(49, 0, 50), new THREE.Vector3(-50, 10, 49));
    wall(new THREE.Vector3(-50, 0, 49), new THREE.Vector3(-49, 10, -49));
    
    //inner
    wall(new THREE.Vector3(-30, 0, -49), new THREE.Vector3(-29, 10, 30));
    wall(new THREE.Vector3(-10, 0, 30), new THREE.Vector3(30, 10, 29));
    wall(new THREE.Vector3(30, 0, 29), new THREE.Vector3(29, 10, -10));
    wall(new THREE.Vector3(29, 0, -10), new THREE.Vector3(10, 10, -9));
    wall(new THREE.Vector3(10, 0, -9), new THREE.Vector3(11, 10, 10));
    wall(new THREE.Vector3(10, 0, 10), new THREE.Vector3(-29, 10, 9));

    wall(new THREE.Vector3(10, 0, -49), new THREE.Vector3(11, 10, -30));
    wall(new THREE.Vector3(30, 0, -30), new THREE.Vector3(-10, 10, -29));
    wall(new THREE.Vector3(-10, 0, -29), new THREE.Vector3(-9, 10, -10));
    

    //Torches
    /*var torchModel;

    const managerTorch = new THREE.LoadingManager();
    managerTorch.onLoad = function() { //when torch model has been loaded. Can clone a bunch of torches in here
        //torch(new THREE.Vector3(0, 5, 30.5));
        //torch(new THREE.Vector3(0, 5, 40));
    }

    const loaderTorch = new FBXLoader(managerTorch);
    loaderTorch.setPath('./Resources/models/Torch/');
    loaderTorch.load('Torch.fbx', (fbx) => {
      const model = fbx;
      fbx.scale.setScalar(0.02);

      torchModel = model;
    });*/



    //player model with animations
    var player;
    const loaderPlayer = new FBXLoader();
    loaderPlayer.setPath('./Resources/models/Rosales/');

    loaderPlayer.load('Kachujin_G_Rosales.fbx', (fbx) => {
        //mesh
        const model = fbx;
        fbx.scale.setScalar(0.01);
        fbx.traverse(c => {
            c.castShadow = true;
        });
        model.rotation.y = -Math.PI;
        scene.add(model);

        //rigid body                                                               
        //player initial position
        var bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.9, 40);
        const q = new THREE.Quaternion().setFromEuler( new THREE.Euler(0, model.rotation.y, 0, 'XYZ') );
        bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
        var rigidBody = world.createRigidBody(bodyDesc);
        var dynamicCollider = RAPIER.ColliderDesc.ball(0.9);
        world.createCollider(dynamicCollider, rigidBody);



        //load animations, store in map and add to mixer
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map();

        const manager = new THREE.LoadingManager();
        manager.onLoad = function() { //when all animations have been loaded
            //pass model, mixer and animations to character controller
            player = new Player(model, mixer, animationsMap, orbitControls, camera, camera2, rigidBody, 
                new RAPIER.Ray( 
                    rigidBody.translation(),
                    { x: 0, y: -1, z: 0} 
                ), 
                new RAPIER.Ray( 
                    rigidBody.translation(),
                    { x: 0, y: 0, z: -1 } 
                )
            );
            startLevelTimer();  
        };


        //load animations
        const loaderAnimations = new FBXLoader(manager);
        loaderAnimations.setPath('./Resources/models/Rosales/');
        loaderAnimations.load('Idle.fbx', (a) => { OnLoad('Idle', a); });
        loaderAnimations.load('Walk.fbx', (a) => { OnLoad('Walk', a); });
        loaderAnimations.load('Run.fbx', (a) => { OnLoad('Run', a); });
        loaderAnimations.load('Punch.fbx', (a) => { OnLoad('Punch', a); });
        loaderAnimations.load('OnHit.fbx', (a) => { OnLoad('OnHit', a); });
        loaderAnimations.load('Death.fbx', (a) => { OnLoad('Death', a); });

        const OnLoad = (animName, anim) => {
            const clip = anim.animations[0];
            const animAction = mixer.clipAction(clip);
            
            //make death animation not loop when it's done
            if (animName == 'Death') {
                animAction.loop = THREE.LoopOnce;
                animAction.clampWhenFinished=true;
            }

            animationsMap.set(animName, animAction);
        };
    });



    //enemy model with animations
    var enemy;
    const loaderEnemy = new FBXLoader();
    loaderEnemy.setPath('./Resources/models/Paladin/');

    loaderEnemy.load('WProp_J_Nordstrom.fbx', (fbx) => {
        //mesh
        const model = fbx;
        fbx.scale.setScalar(0.015);
        fbx.traverse(c => {
            c.castShadow = true;
        });
        scene.add(model);

        //rigid body                                                                //enemy initial position
        var bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -9.9, -105);
        const q = new THREE.Quaternion().setFromEuler( new THREE.Euler(0, model.rotation.y, 0, 'XYZ') );
        bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
        var rigidBody = world.createRigidBody(bodyDesc);
        var dynamicCollider = RAPIER.ColliderDesc.ball(1.1);
        world.createCollider(dynamicCollider, rigidBody);
        


        //load animations, store in map and add to mixer
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map();

        //load animations
        const loaderAnimations = new FBXLoader();
        loaderAnimations.setPath('./Resources/models/Paladin/');
        loaderAnimations.load('Idle.fbx', (a) => { OnLoad('Idle', a); });
        loaderAnimations.load('Walk.fbx', (a) => { OnLoad('Walk', a); });
        loaderAnimations.load('Slash.fbx', (a) => { OnLoad('Slash', a); });
        loaderAnimations.load('Impact.fbx', (a) => { OnLoad('OnHit', a); });
        loaderAnimations.load('Death.fbx', (a) => { OnLoad('Death', a); });

        const OnLoad = (animName, anim) => {
            const clip = anim.animations[0];
            const animAction = mixer.clipAction(clip);
            //make death animation not loop when it's done
            if (animName == 'Death') {
                animAction.loop = THREE.LoopOnce;
                animAction.clampWhenFinished=true;
            }


            animationsMap.set(animName, animAction);
            if (animName == 'Death') { //if all animations have been loaded
                //make enemy object
                enemy = new Enemy(model, mixer, animationsMap, rigidBody, 
                    new RAPIER.Ray( 
                        rigidBody.translation(),
                        { x: 0, y: -1, z: 0} 
                    ), 
                    new RAPIER.Ray( 
                        rigidBody.translation(),
                        { x: 0, y: 0, z: 1 } 
                    )
                );
            }
        };
    });



    //PLAYER CONTROLS
    const keysPressed = {'w': false, 'a': false, 's': false, 'd': false, 'q': false, 'e': false};
    const keyDisplayQueue = new KeyDisplay();

    document.addEventListener('keydown', (event) => {
        keyDisplayQueue.down(event.key);          
        keysPressed[event.key.toLowerCase()] = true ;   
        
    }, false);
    document.addEventListener('keyup', (event) => {
        keyDisplayQueue.up(event.key);                 
        keysPressed[event.key.toLowerCase()] = false;  

    }, false);

    //3RD AND 1ST PERSON
    var firstPerson = false;
    document.addEventListener('keypress', (event) => {
        if (event.key.toLowerCase()=='t' && player) {
            firstPerson = !firstPerson;

            if(firstPerson==true) {
                camera.position.set(player.model.position.x, player.model.position.y + 2.5, player.model.position.z-1);
                orbitControls.minDistance=0;
                orbitControls.maxDistance=0.6;
                player.firstPerson=true;
                
            }
            else {
                camera.position.set(0, 5, 6);
                orbitControls.minDistance=6;
                orbitControls.maxDistance=6; 
                player.firstPerson=false;
            }
        }
        
    }, false);


    //PAUSE CONTROLS AND CLOCK INITIALIZATION
    const clock = new THREE.Clock();
    var paused = false;
    document.addEventListener('keypress', (event) => {
        if (event.key.toLowerCase()=='p') {
            paused = !paused;

            if(paused) {
                stopLevelTimer();
                clock.stop();
                ps.textContent="PAUSED";
                
            }
            else {
                startLevelTimer();
                clock.start();
                ps.textContent="";
            }
        }

        if (event.key.toLowerCase()=='r'){
            location.reload();
        }
        
    }, false);
    

    //WHAT HAPPENS ON EACH UPDATE
    function animate() {
        if (!paused) {
            var deltaTime = clock.getDelta();
        
            if (enemy && player) {
                player.update(world, deltaTime, keysPressed, enemy);
                enemy.update(world, deltaTime, player);

                if(enemy.death==true) {                                          //if player kills enemy, they win and are invincible
                    stopLevelTimer();
                    dub.textContent = "YOU WIN!";

                    player.win = true;
                }
                if (timeLeft<=0 || player.death==true) {                         //if time runs out or they were killed they die
                    stopLevelTimer();
                    player.death=true; //if timer runs out need to do this

                    loss.textContent = 'YOU DIED';
                }

                //if spawn point must change when player reaches a certain location
                if(player.model.position.z<-50) {
                    player.spawnPoint.set(0, 0.9, -52);
                }
            }

            world.step(); //run physics simulation
            for (let i = 0; i < rigidBodies.length; i++) {
                //update the mesh to match the new position of the rigid body
                let position = rigidBodies[i].rigid.translation();
                let rotation = rigidBodies[i].rigid.rotation();

                rigidBodies[i].mesh.position.x = position.x;
                rigidBodies[i].mesh.position.y = position.y;
                rigidBodies[i].mesh.position.z = position.z;
                rigidBodies[i].mesh.setRotationFromQuaternion(new THREE.Quaternion(rotation.x,rotation.y,rotation.z,rotation.w));
            }    
        }
        
        orbitControls.update();
        renderer.render(scene, camera);
        composer.render();
        requestAnimationFrame(animate);
    }
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(renderer2.domElement);
    animate();



    //HELPER FUNCTIONS
    //RESIZE HANDLER
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);        
    }
    window.addEventListener('resize', onWindowResize);


    //LIGHTS
    function mainLighting() {
        //ambient light
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        //directional light
        const dirLight = new THREE.DirectionalLight(0xDD8B41, 0.8);
        dirLight.position.set(-120, 80, 0);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = - 50;
        dirLight.shadow.camera.left = - 50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);
    }


    //REPEATING TEXTURES
    function wrapAndRepeatTextureFloor (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = map.repeat.y = 20;
    }

    function wrapAndRepeatTextureWall (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = 3;
        map.repeat.y = 1;
    }

    function wrapAndRepeatTextureRamp (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = 3;
        map.repeat.y = 3;
    }


    //FLOOR
    function floor() {
        //textures
        const textureLoader = new THREE.TextureLoader();
        //const texture = textureLoader.load("./resources/textures/floors/placeholder.png");
        const texture = textureLoader.load("./resources/textures/floors/ground_grass.jpg");
        
        //dimensions
        const WIDTH = 100;
        const HEIGHT = 1;
        const LENGTH = 100;

        const geometry = new THREE.BoxGeometry(WIDTH, HEIGHT, LENGTH);
        const material = new THREE.MeshStandardMaterial({ map: texture });
        wrapAndRepeatTextureFloor(material.map);


        //mesh
        const meshFloor = new THREE.Mesh(geometry, material);
        meshFloor.position.y=-0.5;
        meshFloor.receiveShadow = true;
        scene.add(meshFloor);
        
        //rigid body
        var bodyDesc = RAPIER.RigidBodyDesc.fixed();
        bodyDesc.setCanSleep(true);
        bodyDesc.setTranslation(meshFloor.position.x, meshFloor.position.y, meshFloor.position.z);
        const rigidBody = world.createRigidBody(bodyDesc);
        var collider = RAPIER.ColliderDesc.cuboid(WIDTH*0.5, HEIGHT*0.5, LENGTH*0.5);
        world.createCollider(collider, rigidBody);
    }


    //WALLS
    function wall(startPoint, endPoint) {
        const wallSize = new THREE.Vector3(Math.abs(endPoint.x-startPoint.x), Math.abs(endPoint.y-startPoint.y), Math.abs(endPoint.z-startPoint.z));
        const wallPos = new THREE.Vector3((endPoint.x+startPoint.x)/2, (endPoint.y+startPoint.y)/2, (endPoint.z+startPoint.z)/2);

        const geometry = new THREE.BoxGeometry(wallSize.x, wallSize.y, wallSize.z);
        
        //mesh
        const meshWall = new THREE.Mesh(geometry, materialWall);
        meshWall.position.copy(wallPos);
        meshWall.castShadow = true;
        meshWall.receiveShadow = true;
        scene.add(meshWall);

        //rigid body
        var bodyDesc = RAPIER.RigidBodyDesc.fixed();
        bodyDesc.setCanSleep(true);
        bodyDesc.setTranslation(meshWall.position.x, meshWall.position.y, meshWall.position.z);
        const rigidBody = world.createRigidBody(bodyDesc);
        var collider = RAPIER.ColliderDesc.cuboid(wallSize.x*0.5, wallSize.y*0.5, wallSize.z*0.5);
        world.createCollider(collider, rigidBody);
    }


    //TORCHES
    function torch(lightPos) {
        //mesh
        var model = torchModel.clone();
        model.position.set(lightPos.x, lightPos.y-1, lightPos.z);
        //model.position.set(0, 4, 30);
        scene.add(model);

        //light
        const light = new THREE.PointLight('orange', 1, 10, 2);
        light.castShadow = true;
        light.position.copy(lightPos);
        scene.add(light); 
    }   
}