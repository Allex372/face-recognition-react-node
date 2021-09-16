Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start);

async function start() {
    alert('loaded')
}

async function takeSnapshot() {
    Webcam.snap(function (data_url) {
        document.getElementById('result').innerHTML = '<img id="img_result" src="' + data_url + '"/>';
    })
    let newImg = document.getElementById('img_result');
    document.body.append(newImg)
    const container = document.createElement('div');
    container.style.position = 'relative';
    document.body.append(container);
    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    let canvas;
    if (canvas) canvas.remove();
    container.append(newImg)
    canvas = faceapi.createCanvasFromMedia(newImg);
    container.append(canvas)
    const displaySize = {width: newImg.width, height: newImg.height}
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(newImg).withFaceLandmarks().withFaceDescriptors();
    // document.body.append(detection.length) //we understand how many faces on the picture
    const resizeDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizeDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
        const box = resizeDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {label: result.label.toString()})
        drawBox.draw(canvas)
    })
}

function loadLabeledImages() {
    const labels = ['Andrii Kosaniak', 'Baran Oleksandr', 'Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Carrey', 'Jim Rhodes', 'Johnny Depp', 'Thor', 'Tony Stark'];
    return Promise.all(
        labels.map(async label => {
            const descriptions = [];
            for (let i = 1; i <= 4; i++) {
                const img = await faceapi.fetchImage(`./labeled_images/${label}/${i}.jpg`);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    )
}
