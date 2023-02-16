// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

const definitionName = "hotdogjpeg.gh";
//const definitionName = document.getElementById("ShowMesh").checked ? "hotdogjpeg.gh" : "hotdogjpegEdges.gh";

// Set up sliders
const length_slider = document.getElementById("length");
length_slider.addEventListener("mouseup", onSliderChange, false);
length_slider.addEventListener("touchend", onSliderChange, false);

const rise_slider = document.getElementById("rise");
rise_slider.addEventListener("mouseup", onSliderChange, false);
rise_slider.addEventListener("touchend", onSliderChange, false);

const radius_slider = document.getElementById("radius");
radius_slider.addEventListener("mouseup", onSliderChange, false);
radius_slider.addEventListener("touchend", onSliderChange, false);

const boolean_slider = document.getElementById("boolean");
boolean_slider.addEventListener("mouseup", onSliderChange, false);
boolean_slider.addEventListener("touchend", onSliderChange, false);


const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  //Commenting off. First one mentioned would be the default loaded. 
  //Local Computer (Turn on / off by uncommenting the line below)
  //RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.

  //Use MaCAD server (Turn on / off by uncommenting the two lines below) **Backslash at end every important
  RhinoCompute.url = 'http://35.157.191.153/' // RhinoCompute server url. Use http://localhost:8081 if debugging locally.

  //Set API key, can leave blank if debugging locally. Needs to be left on if using option below.
  RhinoCompute.apiKey = 'macad2023' 

  //Checkbox disabled. Would offer option to switch between local and remote compute
  // const computeCheckbox = document.getElementById("computeCheckbox");
  // computeCheckbox.addEventListener("change", function() {
  //   if (computeCheckbox.checked) {
  //     RhinoCompute.url = 'http://35.157.191.153/'
  //   } else {
  //     RhinoCompute.url = "http://localhost:8081/";
  //   }
  //   compute();
  // });

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
  const param1 = new RhinoCompute.Grasshopper.DataTree("length");
  param1.append([0], [length_slider.valueAsNumber]);

  const param2 = new RhinoCompute.Grasshopper.DataTree("rise");
  param2.append([0], [rise_slider.valueAsNumber]);

  const param3 = new RhinoCompute.Grasshopper.DataTree("radius");
  param3.append([0], [radius_slider.valueAsNumber]);

  const param4 = new RhinoCompute.Grasshopper.DataTree("boolean");
  param4.append([0], [boolean_slider.valueAsNumber]);

  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);
  trees.push(param3);
  trees.push(param4);



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

  // Z Up
  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 )

  // create a scene and a camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color( "rgb(255, 212, 212)" );
  camera = new THREE.PerspectiveCamera(
    15,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = -30;
  camera.position.y = -30;
  camera.position.z = 30;

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  //renderer.setSize(window.innerWidth, window.innerHeight);
  // changed rendered from full screen to 1440 
  // renderer.setSize(1440, 697);
  renderer.setSize(window.innerWidth*0.6, window.innerHeight*0.6);
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 2;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
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


  // Download a JPG when button Download is clicked
  document.getElementById("download").addEventListener("click", function() {

    var dataURL = renderer.domElement.toDataURL( "image/jpeg" );
  
    // download the image
    var link = document.createElement( "a" );
    link.download = "ParametricHotDog.jpeg";
    link.href = dataURL;
    link.click();
  });
  