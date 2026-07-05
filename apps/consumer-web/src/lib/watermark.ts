export async function watermarkImage(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      await Geolocation.requestPermissions();
      const pos = await Geolocation.getCurrentPosition({ timeout: 5000 });
      applyWatermark(file, pos.coords.latitude, pos.coords.longitude).then(resolve).catch(reject);
    } catch (err) {
      console.warn("Geolocation denied or failed, using unknown coords", err);
      applyWatermark(file, 0, 0).then(resolve).catch(reject);
    }
  });
}

function applyWatermark(file: File, lat: number, lng: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No 2d context"));

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Load logo
        const logo = new Image();
        logo.onload = () => {
          // Draw logo at bottom right, 20% opacity
          ctx.globalAlpha = 0.2;
          const logoWidth = canvas.width * 0.3; // 30% of image width
          const logoHeight = (logo.height / logo.width) * logoWidth;
          ctx.drawImage(
            logo,
            canvas.width - logoWidth - 20,
            canvas.height - logoHeight - 20,
            logoWidth,
            logoHeight
          );

          // Reset alpha for text
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

          ctx.fillStyle = "#ffffff";
          ctx.font = `${Math.max(16, canvas.width * 0.03)}px sans-serif`;
          ctx.textAlign = "left";
          
          const dateStr = new Date().toLocaleString();
          const coordStr = lat === 0 && lng === 0 ? "Location: Unknown" : `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          
          ctx.fillText(`FixIt Now Verified - ${dateStr}`, 20, canvas.height - 35);
          ctx.fillText(coordStr, 20, canvas.height - 15);

          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        logo.onerror = () => {
          // If logo fails to load, just return the image without logo but with text
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
          ctx.fillStyle = "#ffffff";
          ctx.font = `${Math.max(16, canvas.width * 0.03)}px sans-serif`;
          const dateStr = new Date().toLocaleString();
          const coordStr = lat === 0 && lng === 0 ? "Location: Unknown" : `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          ctx.fillText(`FixIt Now Verified - ${dateStr}`, 20, canvas.height - 35);
          ctx.fillText(coordStr, 20, canvas.height - 15);
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        logo.src = "/logo-with-name(long).png";
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
