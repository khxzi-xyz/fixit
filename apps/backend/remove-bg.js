const Jimp = require("jimp");

async function run() {
  try {
    const image = await Jimp.read("E:\\.services_app\\logo-with-name(long).png");
    
    // Iterate over all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If the pixel is mostly white (e.g. > 240 for R, G, B), make it transparent
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // alpha to 0
      }
    });

    // Save as transparent logo
    await image.writeAsync("E:\\.services_app\\apps\\web\\public\\logo-with-name(long).png");
    await image.writeAsync("E:\\.services_app\\apps\\consumer-web\\public\\logo-with-name(long).png");
    await image.writeAsync("E:\\.services_app\\apps\\vendor-web\\public\\logo-with-name(long).png");
    
    // Create a square version for favicon (e.g., crop or resize to square)
    // To make it simple, we just save the image as favicon.ico directly (Jimp might not support .ico, so we save as .png and link it as image/png)
    image.resize(64, Jimp.AUTO);
    await image.writeAsync("E:\\.services_app\\apps\\web\\public\\favicon.png");
    await image.writeAsync("E:\\.services_app\\apps\\consumer-web\\public\\favicon.png");
    await image.writeAsync("E:\\.services_app\\apps\\vendor-web\\public\\favicon.png");
    
    console.log("Background removed and favicons generated.");
  } catch (err) {
    console.error(err);
  }
}

run();
