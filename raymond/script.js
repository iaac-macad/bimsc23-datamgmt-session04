// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

const definitionName = 'script_R3.gh'

// Set up sliders
const L_EXTENT_Y_slider = document.getElementById('L_EXTENT_Y')
L_EXTENT_Y_slider.addEventListener('mouseup', onSliderChange, false)
L_EXTENT_Y_slider.addEventListener('touchend', onSliderChange, false)

const L_EXTENT_X_slider = document.getElementById('L_EXTENT_X')
L_EXTENT_X_slider.addEventListener('mouseup', onSliderChange, false)
L_EXTENT_X_slider.addEventListener('touchend', onSliderChange, false)

const S_EXTENT_X_slider = document.getElementById('S_EXTENT_X')
S_EXTENT_X_slider.addEventListener('mouseup', onSliderChange, false)
S_EXTENT_X_slider.addEventListener('touchend', onSliderChange, false)

const S_EXTENT_Y_slider = document.getElementById('S_EXTENT_Y')
S_EXTENT_Y_slider.addEventListener('mouseup', onSliderChange, false)
S_EXTENT_Y_slider.addEventListener('touchend', onSliderChange, false)

const Cluster_A_Position_slider = document.getElementById('Cluster_A_Position')
Cluster_A_Position_slider.addEventListener('mouseup', onSliderChange, false)
Cluster_A_Position_slider.addEventListener('touchend', onSliderChange, false)

const Cluster_B_Position_slider = document.getElementById('Cluster_B_Position')
Cluster_B_Position_slider.addEventListener('mouseup', onSliderChange, false)
Cluster_B_Position_slider.addEventListener('touchend', onSliderChange, false)


const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

let rhino, definition, doc
rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.')
    rhino = m // global


    //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.
    
  // RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.
RhinoCompute.url = "http://35.157.191.153/"; //if debugging locally.
RhinoCompute.apiKey = "macad2023" 


    // load a grasshopper file!
    const url = definitionName
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const arr = new Uint8Array(buffer)
    definition = arr

    init()
    compute()
})

async function compute() {


    const param1 = new RhinoCompute.Grasshopper.DataTree('L_EXTENT_Y')
    param1.append([0], [L_EXTENT_Y_slider.valueAsNumber])

    const param2 = new RhinoCompute.Grasshopper.DataTree('L_EXTENT_X')
    param2.append([0], [L_EXTENT_X_slider.valueAsNumber])

    const param3 = new RhinoCompute.Grasshopper.DataTree('S_EXTENT_X')
    param3.append([0], [S_EXTENT_X_slider.valueAsNumber])

    const param4 = new RhinoCompute.Grasshopper.DataTree('S_EXTENT_Y')
    param4.append([0], [S_EXTENT_Y_slider.valueAsNumber])

    const param5 = new RhinoCompute.Grasshopper.DataTree('Cluster_A_Position')
    param5.append([0], [Cluster_A_Position_slider.valueAsNumber])

    const param6 = new RhinoCompute.Grasshopper.DataTree('Cluster_B_Position')
    param6.append([0], [Cluster_B_Position_slider.valueAsNumber])



    // clear values
    const trees = []
    trees.push(param1)
    trees.push(param2)
    trees.push(param3)
    trees.push(param4)
    trees.push(param5)
    trees.push(param6)

    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)
    console.log(res)
        


    doc = new rhino.File3dm()

    // hide spinner
    document.getElementById('loader').style.display = 'none'

    for (let i = 0; i < res.values.length; i++) {

        for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
            for (const d of value) {

                const data = JSON.parse(d.data)
                const rhinoObject = rhino.CommonObject.decode(data)
                doc.objects().add(rhinoObject, null)

            }
        }
    }


    // clear objects from scene
    scene.traverse(child => {
        if (!child.isLight) {
            scene.remove(child)
        }
    })


    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse(buffer, function (object) {

        scene.add(object)
        // hide spinner
        document.getElementById('loader').style.display = 'none'

    })
}


function onSliderChange() {
    // show spinner
    document.getElementById('loader').style.display = 'block'
    compute()
}



// BOILERPLATE //
let scene, camera, renderer, controls

function init() {

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1, 1, 1)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = - 30

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.intensity = 2
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight()
    scene.add(ambientLight)

    animate()
}

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    animate()
}

function meshToThreejs(mesh, material) {
    const loader = new THREE.BufferGeometryLoader()
    const geometry = loader.parse(mesh.toThreejsJSON())
    return new THREE.Mesh(geometry, material)
}