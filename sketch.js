let videos = [];
let poses = [[], [], [], []];

let myVideoIndex;
let vidW = 1920;
let vidH = 1080;
let word
let WORDS

let numStreaks = 1;
let scaleFactor;

const maxXChange = 60;
const maxYChange = 10;
const yNoiseChange = 0.01;
const mouseYNoiseChange = 0.3;
const timeNoiseChange = 0.013;
const confidenceThreshold = 0.1;

let timeDisplay;
let frameCounter = 0;
let tintDirection = 0.5; // 1 for increasing, -1 for decreasing
let personAddresses = [[], [], [], []];  // One array for each video
let personColors = [[], [], [], []];
let noiseOffsets = [[], [], [], []]; // Initialize an empty 2D array for the noise offsets
let wordTrails = [[], [], [], []];

let BGRimage;

let lastSaveTime = 0;
const saveInterval = 30000;  // 30 seconds

const bbColor = [238, 75, 43]; // reddish
const hipsColor = [9,171,155]; 

// let rectColor = [238, 75, 43]; // yellowish

let colors = [[255, 0, 0], [255, 127, 0], [255, 255, 0], [0, 255, 0], [0, 0, 255], [75, 0, 130], [148, 0, 211]];

let colorStops = ["rgba(255,0,0,0.5)", "rgba(255,255,0,0.5)", "rgba(0,255,0,0.5)", 
                  "rgba(0,255,255,0.5)", "rgba(0,0,255,0.5)", "rgba(255,0,255,0.5)",
                  "rgba(255,255,255,0.5)", "rgba(127,127,127,0.5)"];

const TONES = [[196, 43, 167], [97, 153, 147], [69, 136, 247], [217, 136, 96]];

const glitchColors = [
  [255, 255, 255],    // White
  [255, 255, 0],      // Yellow
  [0, 255, 255],      // Cyan
  [0, 255, 0],        // Lime
  [255, 0, 255],      // Magenta
  [255, 0, 0],        // Red
  [0, 0, 255],        // Blue
  [0, 0, 255],        // Blue
  [0, 0, 0],          // Black
  [255, 0, 255],      // Magenta
  [0, 0, 0],          // Black
  [0, 255, 255],      // Cyan
  [0, 0, 0],          // Black
  [255, 255, 255]     // White
];


// CHECK THE CONSOLE TO SEE THE IDS OF EACH CONNECTED CAMERA
// COPY AND PASTE EACH ID ONTO ITS CORRESPONDENT VARIABLE
let webcam1DeviceId = "bd19954df8bc4dc1e02b33d38733c9a3390bea859d321d289be197509f792320";
let webcam2DeviceId = "da99dad106512663c981f799f9e3dc836c20b611421373ed03788b80bda3f73a";
let webcam3DeviceId = "da99dad106512663c981f799f9e3dc836c20b611421373ed03788b80bda3f73a";
let webcam4DeviceId = "da99dad106512663c981f799f9e3dc836c20b611421373ed03788b80bda3f73a";

let randomX, randomY; // used for segment of overimposed second video

function preload() {
   defaultFont = loadFont("default.ttf");
   loadStrings('words.txt', fileLoaded);
   BGRimage = loadImage('cloud.png');

}

// 1 CAM DEV VERSION
function createVideoAndModel(source, isCapture , poseArray, videoIndex) {
    let video;

    pixelDensity(1);
        if (isCapture) {
            video = createCapture(VIDEO, () => {
            scaleFactor = Math.min(vidW / video.width, vidH / video.height);
        });
    } else {
        video = createVideo(source);
        video.loop();
    }
    video.size(vidW, vidH);
    video.hide();

    let poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', (results) => {
        poseArray.splice(0, poseArray.length, ...results);
        updatePersonAddresses(poseArray, videoIndex); 
    });

    return { video, poseNet };
}

// 4 CAMS DEV VERSION
// Function to create a video and its associated poseNet model
function createVideoAndModel_4cams(source, isCapture, poseArray, videoIndex, deviceId) {
    let video;

    if (isCapture) {
        // Create an HTML video element
        video = document.createElement('video');
        video.style.display = 'none'; // Hide the video element
        document.body.appendChild(video); // Append it to the body

        // Request the video stream and start the video
        navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => { // Wait for the metadata to load
                video.width = vidW;
                video.height = vidH;
                video.play();
                scaleFactor = Math.min(vidW / video.videoWidth, vidH / video.videoHeight);
            };
        })
      .catch(err => console.error(err));
    } else {
        video = createVideo(source);
        video.loop();
        video.size(vidW, vidH);
        video.hide();
    }

    let poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', (results) => {
        poseArray.splice(0, poseArray.length, ...results);
        updatePersonAddresses(poseArray, videoIndex); 
    });

  return { video, poseNet };
}

function modelLoaded() {
    console.log('PoseNet Model Loaded!');
}

function fileLoaded(data) {
    // Process the data from the text file
    const wordsArray = data.join(',').split(',');

    // Remove whitespace and convert to lowercase
    WORDS = wordsArray.map(word => word.trim().toLowerCase());
}

function setup() {

    createCanvas(vidW * 2, vidH*2);
    word = random(WORDS)
    colors = colors.map(rgb => color(...rgb));
    
    // Generate random x and y coordinates within the bounds of the video dimensions.
    randomX = 0 //random(0, vidW - 300);
    randomY = 0 //random(0, vidH - 300);

    let dev_version = 1;

    // 1 CAM DEV VERSION
    if (dev_version == 1) {
        videos.push(createVideoAndModel(null, true, poses[0],0));
        videos.push(createVideoAndModel('c13.m4v', false, poses[1],1));
        videos.push(createVideoAndModel('3.m4v', true, poses[2], 2));
        videos.push(createVideoAndModel('untitled.m4v', false, poses[3], 3)); 
    }

    // 4 CAMS DEV VERSION
    if (dev_version == 2) {
        videos.push(createVideoAndModel_4cams(null, true, poses[0],0, webcam1DeviceId));
        videos.push(createVideoAndModel_4cams('c13.m4v', true, poses[1],1, webcam2DeviceId));
        videos.push(createVideoAndModel_4cams('3.m4v', true, poses[2], 2, webcam3DeviceId));
        videos.push(createVideoAndModel_4cams('untitled.m4v', true, poses[3], 3, webcam4DeviceId));
    }

    // define which video to use for the segment drawn in drawBoundingBox
    myVideoIndex = 0 //random(videos.length);

    timeDisplay = createElement('h2', '');
    timeDisplay.position(100, vidH + 300);
    timeDisplay.class('time-display');
}

function draw() {



  background(0);

  frameCounter += tintDirection;
  if (frameCounter == 200 || frameCounter == 0){
      tintDirection *= -1;
  }

  if (frameCounter % 20 == 0){
      word = random(WORDS);
  }

  for (let i = 0; i < videos.length; i++) {
    const vid = videos[i];

  const col = i % 2;  // Column index (0 or 1)
  const row = floor(i / 2);  // Row index (0 or 1)
  const xPos = (i%2) * vidW;  // X position of the video
  const yPos = row * vidH;  // Y position of the video


    image(vid.video, xPos, yPos, vidW, vidH);

    for (let j = 0; j < numStreaks; j++) {
        // drawCrop(vid.video, i * (width / videos.length))
        // drawStreak(vid.video, i * (width / videos.length));
        // drawRainbowStreaks(vid.video, i * (width / videos.length));
    }

    // fill(invertColor(tintColor));
    // rect(i*vidW,0,vidW * 4, vidH)
    fill(255,255,255,frameCounter%255);
    rect(i*vidW,0,vidW * 2, vidH*2)

    drawBoundingBox(i, xPos, yPos);

  	wordTrails[i].forEach((trail, index) => {
  	    fill(0, trail.lifespan);
  	    textSize(15);
        textFont("Courier");

  	    text(trail.word, trail.x, trail.y);
        fill(random(glitchColors).concat(trail.lifespan));
        text(trail.word, trail.x + random(-5, 5), trail.y + random(-5, 5));

  	    trail.lifespan -= 1;  // Decrease the lifespan for next frame

  	    if (trail.lifespan <= 0) {
  	        wordTrails[i].splice(index, 1);
  	    }
  	});

    textSize(40);  // Time display
    fill(255);  
    text(i+1, i*vidW + 30, 50);  // Position of text is 10 pixels from left edge of each video and roughly in the middle of the first line of text (adjust as needed)
  }

  push();
  filter(INVERT);
  let r_i = int(random(4))
  drawCrop(videos[r_i].video, r_i * (width / videos.length))
  pop()

  drawGlitchRectangle(0, 0, vidW, vidH / 20, 7, glitchColors);
  drawGlitchRectangle(vidW, 0, vidW, vidH / 20, 7, glitchColors);
    drawGlitchRectangle(0, vidH, vidW, vidH / 20, 7, glitchColors);
    drawGlitchRectangle(vidW, vidH, vidW, vidH / 20, 7, glitchColors);



  let d = new Date();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  let seconds = d.getSeconds();
  let milliseconds = d.getMilliseconds();

  let timeStr = `${str(hours).padStart(2, '0')}:${str(minutes).padStart(2, '0')}:${str(seconds).padStart(2, '0')}:${str(milliseconds).padStart(3, '0')}`;
  timeDisplay.html(timeStr);


  if (millis() - lastSaveTime >= saveInterval){
    saveCanvas('canvas', 'png'); // Save the canvas as a PNG image
    lastSaveTime = millis(); // Update the last save time
  }


}

function drawCrop(video, offset = 0){
    const cropX = random(1024);
    const cropY = random(1024);
    const cropWidth = random(100, 400);  // Adjust the range of crop width as needed
    const cropHeight = random(100, 400);  

    image(BGRimage, random(vidW)+offset, random(vidH), cropWidth, cropHeight, cropX, cropY, cropWidth, cropHeight);
    // BGRimage.filter(INVERT);
    // image(videos[0].video, random(vidW)+offset, random(vidH), cropWidth, cropHeight, cropX, cropY, cropWidth, cropHeight);
}

function drawStreak(video, xOffset = 0) {

    let y = floor(random(video.height)); 
    let h = floor(video.height / 50 ); 

    // let h = floor(video.height); 

    let xChange = floor(map(noise(y * yNoiseChange, (frameCount) * timeNoiseChange), 0.06, 0.94, -maxXChange, maxXChange)); 
    let yChange = floor(xChange * (maxYChange / maxXChange) * random() > 0.1 ? -1 : 1);

    push();
    let sy = random(video.height - h);

    // console.log(y + yChange, video.height)
    image(video, xOffset, y + yChange, vidW, h, xChange, y, vidW, h);
    // image(video, xOffset, y + yChange, vidW, h, xChange, y, video.width, h*2);

    // image(video, xOffset, y + yChange, vidW, h*2, xChange, xChange, video.width, h * 2);
    // image(video, xOffset, y + yChange, vidW, h * 2, xChange, y, vidW, h * 2);
    // image(video, xOffset, y + yChange, vidW, h * 4, xChange, sy, video.width, h * 4);
    pop();
}

function drawRainbowStreaks(video, xOffset = 0) {
    let y = floor(random(height));  // Y position of the streak
    let streakHeight = 10;  // Height of the streak

    let gradient = drawingContext.createLinearGradient(xOffset, y, xOffset + vidW, y);

    // let colorStops = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"];

    // Gradient color stops distribute along the x-axis of the streak
    colorStops.forEach((stopColor, i, arr) => {
    gradient.addColorStop(i / (arr.length - 1), stopColor);
    });

    // Save the current drawing style
    push();

    // Set the fill style to the gradient and draw the streak
    drawingContext.fillStyle = gradient;
    rect(xOffset, y, vidW, streakHeight);

    // Restore the drawing style
    pop();
}

function drawBoundingBox(videoIndex, xOffset = 0, yOffset = 0) {
    let videoPoses = poses[videoIndex];
    let videoAddresses = personAddresses[videoIndex]; 

    for (let i = 0; i < videoPoses.length; i++) {     // for each pose

        let keypoints = videoPoses[i].pose.keypoints;
        let poseConfidence = videoPoses[i].pose.score;

        if (poseConfidence > confidenceThreshold) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for (let j = 0; j < keypoints.length; j++) { 
                const x = keypoints[j].position.x + xOffset;
                const y = keypoints[j].position.y + yOffset;

                if (x < minX) {
                    minX = x;
                }
                if (y < minY) {
                    minY = y;
                }
                if (x > maxX) {
                    maxX = x;
                }
                if (y > maxY) {
                    maxY = y;
                }
            }

            let boxWidth = maxX - minX;
            let boxHeight = maxY - minY;

            let pose = videoPoses[i].pose;
            let poseID = videoPoses[i].pose.poseNetId;
            let address = personAddresses[videoIndex][i];
            let strokeWidth = map(max(boxWidth, boxHeight), 0, width, 0, 40);

            let rightWrist = pose.keypoints[9].position;
            let rightShoulder = pose.keypoints[5].position;
            let leftWrist = pose.keypoints[10].position;
            let leftShoulder = pose.keypoints[6].position;
            let rightHip = pose.keypoints[12].position;
            let leftHip = pose.keypoints[11].position;

            noFill();
            textFont("sans-serif");
            stroke(invertColor(bbColor));
            strokeWeight(strokeWidth);
            textSize(int(0.5 * (maxX - minX)));
            text(address, minX, minY - 5); // position text 5 pixels above the bounding box

            if (rightWrist.y < rightShoulder.y || leftWrist.y < leftShoulder.y) {
                personColors[videoIndex][i] = invertColor(bbColor); // Hands up, change to red
                personColors[videoIndex][i].push(150); 
                fill(personColors[videoIndex][i]);
                noStroke();
            } else if (Math.abs(rightHip.x - leftHip.x) > boxWidth*0.5) {
                personColors[videoIndex][i] = invertColor(hipsColor); // Hips apart, change to cyan
                personColors[videoIndex][i].push(150); 
                fill(personColors[videoIndex][i]);
                noStroke();
            } else {
                // personColors[videoIndex][i] = invertColor(rectColor); // Otherwise, change to yellow
                personColors[videoIndex][i] = [0,0,0,0];
                noFill();
                stroke(invertColor(bbColor));
            }

            let noisyY = map(noise(noiseOffsets[videoIndex][i]), 0, 1, 0, vidH); // Map the noise value to the range of the bounding box
            noiseOffsets[videoIndex][i] += 0.02; // increment the noise offset for the next frame

            // doppelganger
            fill(personColors[videoIndex][i]);
            noStroke();
            // image(videos[1].video, minX, noisyY, boxHeight*0.7, boxHeight*2, maxX+maxX*0.05, noisyY, boxHeight*0.7, boxHeight*2)

            // new segment from separate video V1 – same coor as "adjacent colour rect"
            //image(videos[myVideoIndex].video, maxX+maxX*0.05, noisyY, boxHeight*0.7, boxHeight*2, 0, 400, 0, 100);
            // new segment from separate video V2 – same coor as "subject tinted bounding box"
            //image(videos[myVideoIndex].video, maxX+maxX*0.01 - 300, noisyY, boxHeight*0.7, boxHeight*2, 0, 400, 0, 100);

            myVideoIndex = (videoIndex + 1)%4;

            let video = videos[myVideoIndex].video;
            let videoWidth = video.width;
            let videoHeight = video.height;

            //// Generate random x and y coordinates within the bounds of the video dimensions.
            //let randomX = random(0, videoWidth - 300);
            //let randomY = random(0, videoHeight - 300);

            // Now use these coordinates as the source rectangle (sx, sy, sWidth, sHeight)
            // image(video, 
            //     maxX + maxX * 0.01 - 300, noisyY, boxHeight * 0.7, boxHeight * 2, randomX, randomY, 300, 300);
            image(video, 
                maxX+maxX*0.05, noisyY, boxHeight * 0.7, boxHeight * 2, randomX, randomY, 300, 300);

            // adjacent colour rect
            rect(maxX+maxX*0.05, noisyY, boxHeight*0.7, boxHeight*2);
            // subject tinted bounding box
            rect(minX, minY, maxX - minX, maxY - minY);

            // Word trails
            stroke([0,0,0,0])
            if (keypoints[9].score > confidenceThreshold) {  // If right wrist is detected
                let trail = {
                    word: word,
                    x: keypoints[9].position.x + xOffset,
                    y: keypoints[9].position.y + yOffset,
                    lifespan: 200  // Start with a full lifespan of 255 frames
                };
                wordTrails[videoIndex].push(trail);
            }

            if (keypoints[10].score > confidenceThreshold) {  // If left wrist is detected
                let trail = {
                    word: word,
                    x: keypoints[10].position.x + xOffset,
                    y: keypoints[10].position.y + yOffset,
                    lifespan: 200  // Start with a full lifespan of 255 frames
                };
                wordTrails[videoIndex].push(trail);
            }      
        }
    }
}

function drawGlitchRectangle(x, y, width, height, columns, colors) {
  const columnWidth = width / columns;
  const rowHeight = height / 2;

  // Iterate through each column
  for (let i = 0; i < columns; i++) {
    const columnX = x + i * columnWidth;

    // Calculate the y positions for the top and bottom rows
    const topRowY = y;
    const bottomRowY = y + rowHeight*2;

    // Set the fill colors for the top and bottom rows
    const topFillColor = colors[i];
    const bottomFillColor = colors[i + columns];

    // Draw the rectangles for the top and bottom rows
    fill(topFillColor);
    rect(columnX, topRowY, columnWidth, rowHeight*2);

    fill(bottomFillColor);
    rect(columnX, bottomRowY, columnWidth, rowHeight);
  }
}





function updatePersonAddresses(poseArray, videoIndex) {
    // Reset person addresses when no poses are detected
    if (poseArray.length === 0) {
        personAddresses[videoIndex] = [];
        personColors[videoIndex] = [];
        noiseOffsets[videoIndex] = [];
    }

    for (let i = 0; i < poseArray.length; i++) {
        let pose = poseArray[i].pose;
        if (personAddresses[videoIndex] && !personAddresses[videoIndex][i]) {
            personAddresses[videoIndex][i] = generateRandomEthAddress();
            personColors[videoIndex][i] = invertColor(random(TONES)).concat(125);
            noiseOffsets[videoIndex][i] = random(1000); // give each pose a random initial noise offset
        }
    }
}

function generateRandomEthAddress() {
    let address = '0x';
    for (let i = 0; i < 40; i++) {
        let digit = Math.floor(Math.random() * 16).toString(16);
        address += digit;
    }
    return address;
}

function invertColor(colorArray) {
    // If the input is an RGBA array
    if (colorArray.length === 4) {
        return [255 - colorArray[0], 255 - colorArray[1], 255 - colorArray[2], colorArray[3]];
    } 
    // If the input is an RGB array
    else if (colorArray.length === 3) {
        return [255 - colorArray[0], 255 - colorArray[1], 255 - colorArray[2]];
    }  
    // return colorArray
}

navigator.mediaDevices.enumerateDevices().then(devices => {
    devices.forEach(device => {
        console.log(device.kind + ": " + device.label +
            " id = " + device.deviceId);
    });
})
.catch(function(err) {
    console.log(err.name + ": " + err.message);
});
