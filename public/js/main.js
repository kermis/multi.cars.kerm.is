var debug = false;

var score = 0;

var timeRemaining = 120;

if (!Detector.webgl) Detector.addGetWebGLMessage();

//three.js vars
var container, stats;

var camera, sceneCam, controls, scene, renderer, composer, POVcamera, cameras = [];

var overViewCam;
var overViewCamHolder;

var POVcamHolder;
var Pcamera;

var camArr;

var sky;

var otoo;

var playing = false;

var mapCamera, mapWidth = 240,
    mapHeight = 160; // w/h should match div dimensions

var playingWithLeap = false;
var playingWithPhone = true;
var playingWithKeys = false;

var views = [{
    left: 0,
    bottom: 0.5,
    width: 0.5,
    height: 0.5,
    fov: 40,
}, {
    left: 0.5,
    bottom: 0.5,
    width: 0.5,
    height: 0.5,
    fov: 40,
}, {
    left: 0,
    bottom: 0,
    width: 0.5,
    height: 0.5,
    fov: 40,
}, {
    left: 0.5,
    bottom: 0,
    width: 0.5,
    height: 0.5,
    fov: 40,
}];

$(function() {
    var queue = new createjs.LoadQueue();
    queue.installPlugin(createjs.Sound);
    queue.on("complete", handleComplete, this);
    queue.on("progress", handleProgress, this);
    queue.loadManifest([
        // {id: "physijs_worker",src: "/js/libs/physijs_worker.js"},
        {
            id: "ammo",
            src: "/js/libs/ammo.js"
        }, {
            id: "landscape",
            src: "/models/landscape3.js"
        }, {
            id: "physijs_worker",
            src: "/models/botsotoo.js"
        }, {
            id: "bump",
            src: "/sound/bump.mp3"
        }, {
            id: "tuut",
            src: "/sound/tuut2.mp3"
        }, {
            id: "music",
            src: "/sound/jump.mp3"
        }
    ]);


})

function handleComplete() {
    $('.overlay').delay(10).fadeOut('slow');
    init();
    animate();

    // playing = true;
    // createjs.Sound.play("music", {loop:-1});
}

function handleProgress(e) {
    var percentLoaded = Math.round(e.loaded * 100);
    $('.percentLoaded').html(percentLoaded + ' %');
    $('.progress').css('width', percentLoaded + '%')
}


function init() {

    // world

    // scene = new THREE.Scene();
    Physijs.scripts.worker = '/js/libs/physijs_worker.js';
    Physijs.scripts.ammo = '/js/libs/ammo.js';


    // Pysics stuff
    scene = new Physijs.Scene({
        fixedTimeStep: 1 / 120
    });
    scene.setGravity(new THREE.Vector3(0, -400, 0));
    camConfig();



    //landscape
    var landscape = new THREE.ObjectLoader();
    landscape.load('/models/landscape3.js', function(mesh) {
        // console.log(mesh);

        mesh.scale.set(0.1, 0.1, 0.1);
        scene.add(mesh);

    });



    physics.setGround();
    physics.makeACar(camConfig);

    //
    // lights
    // var light = new THREE.HemisphereLight(0xFFC8C8, 1.5)
    // var light = new THREE.HemisphereLight(0xB98EFA, 0.8) //--> paars
    // var light = new THREE.HemisphereLight(0x63D7FF, 0.4) // --> lichtblauw
    var light = new THREE.HemisphereLight(0xF3FF8E, 0.2) // --> lichtgeel
    // var light = new THREE.HemisphereLight(0xFFFFFF, 1.2) //--> wit
    scene.add(light)

    var light2 = new THREE.HemisphereLight(0x404040, 0.8); // soft white light
    scene.add(light2);

    //sky
    var geometrySky = new THREE.SphereGeometry(4500, 32, 32)
    var materialSky = new THREE.MeshBasicMaterial({
        // color: 0x261d32
        color: 0x63D7FF
    })
    // materialSky.map = THREE.ImageUtils.loadTexture('../img/sky.jpg')
    materialSky.side = THREE.BackSide;

    sky = new THREE.Mesh(geometrySky, materialSky)
    scene.add(sky);;


    // renderer // can also be angaglyph or some other fancy stuff
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.outstretch = 2.0; // stretches the apparent z-direction
    renderer.outshift = 3.0; // makes the scene come nearer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoclear = false;


    window.addEventListener('resize', onWindowResize, false);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);
    //

    // initPostProcessing();
}

function initPostProcessing() {

    composer = new THREE.EffectComposer(renderer);
    renderModel = new THREE.RenderPass(scene, sceneCam);
    renderModel.renderToScreen = false;
    composer.addPass(renderModel);

    // var effectDotScreen = new THREE.DotScreenPass(
    //     new THREE.Vector2(0, 0), 0.5, 0.8);
    // effectDotScreen.renderToScreen = true;
    // composer.addPass(effectDotScreen);

    // var shaderVignette = THREE.VignetteShader;
    // var effectVignette = new THREE.ShaderPass(shaderVignette);
    // // larger values = darker closer to center
    // // darkness < 1  => lighter edges
    // effectVignette.uniforms["offset"].value = 0.7;
    // effectVignette.uniforms["darkness"].value = 1.3;
    // effectVignette.renderToScreen = true;
    // composer.addPass(effectVignette);


    // var bokehPass = new THREE.BokehPass(scene, camera, {
    //     focus: 1.0,
    //     aperture: 0.025,
    //     maxblur: 50.0,

    //     width: window.innerWidth,
    //     height: window.innerHeight
    // });

    // bokehPass.renderToScreen = true;

    // composer.addPass(bokehPass);



    // var hblur = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader, 0);
    // console.log(hblur.uniforms);
    // var vblur = new THREE.ShaderPass(THREE.VerticalTiltShiftShader, 0);
    // var bluriness = 5;

    // // if(hblur && vblur){
    //     hblur.uniforms['h'].value = bluriness / window.innerWidth;
    //     vblur.uniforms['v'].value = bluriness / window.innerHeight;
    //     hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.5;
    //     console.log('blurblur')
    // // }

    // composer.addPass(hblur);
    // composer.addPass(vblur);


    // var shaderSettings = {
    //             rings: 3,
    //             samples: 4
    //         };

    // var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

    // var rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
    // var rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

    // var bokeh_shader = THREE.BokehShader;

    // var bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);

    // bokeh_uniforms["tColor"].value = rtTextureColor;
    // bokeh_uniforms["tDepth"].value = rtTextureDepth;

    // bokeh_uniforms["textureWidth"].value = window.innerWidth;

    // bokeh_uniforms["textureHeight"].value = window.innerHeight;

    // // var materialBokeh = new THREE.ShaderMaterial({

    // //     uniforms: bokeh_uniforms,
    // //     vertexShader: bokeh_shader.vertexShader,
    // //     fragmentShader: bokeh_shader.fragmentShader,
    // //     defines: {
    // //         RINGS: shaderSettings.rings,
    // //         SAMPLES: shaderSettings.samples
    // //     }

    // // });

    // // var quad = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), materialBokeh);
    // // quad.position.z = -500;
    // composer.addPass(quad);


}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    // controls.handleResize();

    render();

}

function animate() {

    // if(!gameOver){

    render();

    requestAnimationFrame(animate);

    if (playing) {
        scene.simulate();
    }

    // }
    // controls.update();

}


function render() {

    // renderer.render(scene, sceneCam);
    // renderer.clear();
    // composer.render();
    //
    var w = windowWidth = window.innerWidth,
        h = windowHeight = window.innerHeight;

    for (var ii = 0; ii < views.length; ++ii) {


        view = views[ii];
        camera = cameras[ii].children[0];

        if(camera){

            var left = Math.floor(windowWidth * view.left);
            var bottom = Math.floor(windowHeight * view.bottom);
            var width = Math.floor(windowWidth * view.width);
            var height = Math.floor(windowHeight * view.height);
            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);
            renderer.enableScissorTest(true);
            renderer.setClearColor(view.background);

            camera.aspect = width / height;
            // camera.updateProjectionMatrix();

            renderer.render(scene, camera);
        }
    }

    stats.update();

    // sky.rotation.y += 0.001;

    if (otoos[0]) {
        setOtooPosition();
    }



    // renderer.clear();
    // renderer.render( scene, sceneCam );


}

//start the loops
// physicsLoop();
physicsLoopAI();

function physicsLoop() {

    // console.log(otoos[0])
    if (otoos[0]) {
        setOtooPosition();
    }

    setTimeout(function() {
        physicsLoop();
    }, 1000 / 60)

}

function physicsLoopAI() {

    // console.log(otoos[0])
    if (cars[1]) {
        lookAtAllTheseCarsMove();
    }

    setTimeout(function() {
        physicsLoopAI();
    }, 2000)

}

function camConfig() {

    for (var ii = 0; ii < views.length; ++ii) {

        console.log(otoos[ii])
        var view = views[ii];
        var POVcamera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 1, 10000);

        POVcamera.position.y = 11;
        POVcamera.position.z = 10;

        var POVcamHolder = new THREE.Object3D();

        POVcamHolder.scale.set(30, 30, 30)
        POVcamHolder.rotation.y = 1.570796;
        // POVcamHolder.__dirtyposition = true;

        POVcamHolder.add(POVcamera);
        cameras[ii] = POVcamHolder;

        view.camera = cameras[ii];
    }

}
