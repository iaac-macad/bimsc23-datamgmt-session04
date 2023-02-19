// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

const definitionName = 'MiniTown'

//  SLIDERS SET UP

//Slider n 01
const NBuildings_slider = document.getElementById('NBuildings')
NBuildings_slider.addEventListener('mouseup', onSliderChange, false)
NBuildings_slider.addEventListener('touchend', onSliderChange, false)

//Slider n 02
const Distance_slider = document.getElementById('Distance')
Distance_slider.addEventListener('mouseup', onSliderChange, false)
Distance_slider.addEventListener('touchend', onSliderChange, false)


//Slider n 03
const Height_slider = document.getElementById('Height')
Height_slider.addEventListener('mouseup', onSliderChange, false)
Height_slider.addEventListener('touchend', onSliderChange, false)

const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

let rhino, definition, doc
rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.')
    rhino = m // global

    RhinoCompute.url = 'http://localhost:8081/' //if debugging locally.

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

//??????????
    //  SLIDERS NAME'S HERE TOO
    //SLIDER 01
    const param1 = new RhinoCompute.Grasshopper.DataTree('NBuildings')
    //console.log(sub_slider.valueAsNumber)
    param1.append([0], [NBuildings_slider.valueAsNumber])


    //SLIDER 02
  const param2 = new RhinoCompute.Grasshopper.DataTree('Distance')
    //console.log(sub_slider.valueAsNumber)
    param2.append([1], [Distance_slider.valueAsNumber])


    //SLIDER 03
    const param3= new RhinoCompute.Grasshopper.DataTree('Height')
    //console.log(sub_slider.valueAsNumber)
    param3.append([2], [Height_slider.valueAsNumber])


    // clear values


    //THE PROBLEM MIGHT BE HERE 
    //SHOULD I ADD MORE PARAMS???
    const tree1 = []
    tree1.push(param1)

    const tree2 = []
    tree2.push(param2)

    const tree3 = []
    tree3.push(param3)

    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)

   // console.log(res)

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
        console.log(object)
        scene.add(object)
        // hide spinner
        document.getElementById('loader').style.display = 'none'

    })
}


function onSliderChange() {
    //show spinner
    document.getElementById('loader').style.display = 'block'
    compute()
}




// BOILERPLATE //

let scene, camera, renderer, controls

function init() {

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0, 0, 0)
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

function getAuth( key ) {
    let value = localStorage[key]
    if ( value === undefined ) {
        const prompt = key.includes('URL') ? 'Server URL' : 'Server API Key'
        value = window.prompt('RhinoCompute ' + prompt)
        if ( value !== null ) {
            localStorage.setItem( key, value )
        }
    }
    return value
  }