// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

//const definitionName = "Twist.gh";
const definitionName = "Twist.gh";

// Set up sliders
const length_slider = document.getElementById("length");
length_slider.addEventListener("mouseup", onSliderChange, false);
length_slider.addEventListener("touchend", onSliderChange, false);

const intRad_slider = document.getElementById("initialRadius");
intRad_slider.addEventListener("mouseup", onSliderChange, false);
intRad_slider.addEventListener("touchend", onSliderChange, false);

const filletRad_slider = document.getElementById("filletRadius");
filletRad_slider.addEventListener("mouseup", onSliderChange, false);
filletRad_slider.addEventListener("touchend", onSliderChange, false);

const rotation_slider = document.getElementById("rotation");
rotation_slider.addEventListener("mouseup", onSliderChange, false);
rotation_slider.addEventListener("touchend", onSliderChange, false);

const scale_slider = document.getElementById("scale");
scale_slider.addEventListener("mouseup", onSliderChange, false);
scale_slider.addEventListener("touchend", onSliderChange, false);

const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  //RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.
  //RhinoCompute.url = "http://www.data-mgmt.com/";
  RhinoCompute.url = "http://35.157.191.153/";
  //RhinoCompute.url = "http://www.data-mgmt.com/"; //setup to run on web
  RhinoCompute.apiKey = 'macad2023'
  // load a grasshopper file!

  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

  init();
  compute();
});

async function compute() {
  const param1 = new RhinoCompute.Grasshopper.DataTree("Length");
  param1.append([0], [length_slider.valueAsNumber]);

  const param2 = new RhinoCompute.Grasshopper.DataTree("Initial Radius");
  param2.append([0], [intRad_slider.valueAsNumber]);

  const param3 = new RhinoCompute.Grasshopper.DataTree("Fillet Radius");
  param3.append([0], [filletRad_slider.valueAsNumber]);

  const param4 = new RhinoCompute.Grasshopper.DataTree("Rotation");
  param4.append([0], [rotation_slider.valueAsNumber]);

  const param5 = new RhinoCompute.Grasshopper.DataTree("Scale Factor");
  param5.append([0], [scale_slider.valueAsNumber]);

  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);
  trees.push(param3);
  trees.push(param4);
  trees.push(param5);

  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );


  //console.log(res);

  doc = new rhino.File3dm();

  // hide spinner
  document.getElementById("loader").style.display = "none";

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);
        doc.objects().add(rhinoObject, null);
      }
    }
  }



  // go through the objects in the Rhino document

  let objects = doc.objects();
  for ( let i = 0; i < objects.count; i++ ) {
  
    const rhinoObject = objects.get( i );


     // asign geometry userstrings to object attributes
    if ( rhinoObject.geometry().userStringCount > 0 ) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
      
    }
  }


  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {

    // go through all objects, check for userstrings and assing colors

    object.traverse((child) => {
      if (child.isLine) {

        if (child.userData.attributes.geometry.userStringCount > 0) {
          
          //get color from userStrings
          const colorData = child.userData.attributes.userStrings[0]
          const col = colorData[1];

          //convert color from userstring to THREE color and assign it
          const threeColor = new THREE.Color("rgb(" + col + ")");
          const mat = new THREE.LineBasicMaterial({ color: threeColor });
          child.material = mat;
        }
      }
    });

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}


// THREE BOILERPLATE //
let scene, camera, renderer, controls;

function init() {
  // create a scene and a camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.25, 0.25, 0.75);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.z = 750;
  camera.position.y = 500;
  camera.position.x = 500;

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 2;
  directionalLight.position.set(0,-200,500);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
  ambientLight.color.set("Red");
  scene.add(ambientLight);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}
