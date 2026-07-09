import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get('invite/:code')
  async getInvite(@Param('code') code: string, @Res() res: Response) {
    const appName = "FixIt Now";
    const appDescription = "Get 1 OMR off your first home service with FixIt Now! Tap here to claim and sign up.";
    const appLogo = "https://consumer.fixit-now.xyz/logo.png"; // Replace with actual logo URL
    const fallbackUrl = `https://consumer.fixit-now.xyz/invite/${code}`; // Replace with actual fallback URL
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${appName} - Invite</title>
          
          <!-- Open Graph Meta Tags -->
          <meta property="og:title" content="${appName} Invite: ${code}">
          <meta property="og:description" content="${appDescription}">
          <meta property="og:image" content="${appLogo}">
          <meta property="og:url" content="https://backend.fixit-now.xyz/invite/${code}">
          <meta property="og:type" content="website">
          
          <!-- Twitter Card Meta Tags -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${appName} Invite: ${code}">
          <meta name="twitter:description" content="${appDescription}">
          <meta name="twitter:image" content="${appLogo}">

          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f4f4f9;
                  color: #333;
                  text-align: center;
              }
              .logo {
                  width: 120px;
                  height: 120px;
                  border-radius: 20px;
                  margin-bottom: 20px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              h1 {
                  margin: 0 0 10px;
                  font-size: 24px;
              }
              p {
                  margin: 0 0 20px;
                  color: #666;
                  max-width: 80%;
              }
              .btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #2563eb;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  transition: background-color 0.2s;
              }
              .btn:hover {
                  background-color: #1d4ed8;
              }
          </style>
      </head>
      <body>
          <!-- Replace with an actual logo URL if available locally -->
          <div style="width: 120px; height: 120px; background-color: #2563eb; border-radius: 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px; font-weight: bold;">
            🛠️
          </div>
          <h1>You've been invited!</h1>
          <p>${appDescription}</p>
          <p>Promo Code: <strong>${code}</strong></p>
          <a href="${fallbackUrl}" class="btn" id="openAppBtn">Open FixIt Now</a>
          
          <script>
            // Attempt to deep link into the app
            document.addEventListener("DOMContentLoaded", function() {
              const deepLink = "fixitnow://invite/${code}";
              const fallbackUrl = "${fallbackUrl}";
              
              // Attempt redirect
              window.location.href = deepLink;
              
              // Fallback to web/store if app doesn't open
              setTimeout(function() {
                window.location.href = fallbackUrl;
              }, 2000);
            });
          </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
