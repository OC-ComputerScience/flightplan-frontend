import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import logoImage from "../assets/Full-OC-Logo.png";

export const generateEventQRCodePDF = async (event, token) => {
  // Create a canvas element
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 1000;

  // Set white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add logo in top right corner
  const logo = new Image();
  logo.src = logoImage;
  await new Promise((resolve) => {
    logo.onload = resolve;
  });
  // Draw logo in top right corner, 50px from top and right edges
  const logoWidth = 315;
  const logoHeight = (logo.height * logoWidth) / logo.width;
  ctx.drawImage(logo, 35, 35, logoWidth, logoHeight);

  // Add event name and subtitle
  ctx.fillStyle = "black";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText(event.name, canvas.width / 2, 200);

  ctx.font = "24px Arial";
  ctx.fillText("Check-In", canvas.width / 2, 250);

  // Generate QR code with full URL
  // I Tried to make this dynamic but it never worked
  const baseUrl =
    "https://flightplan.eaglesoftwareteam.com/2025/flight-plan/t1/";
  const checkInUrl = `${baseUrl}student/event/checkIn/${token.token}`;
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 500,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  // Draw QR code
  const qrImage = new Image();
  qrImage.src = qrDataUrl;
  await new Promise((resolve) => {
    qrImage.onload = resolve;
  });
  ctx.drawImage(qrImage, (canvas.width - 400) / 2, 350, 400, 400);

  // Convert to PDF and download
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [800, 1000],
  });
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, 800, 1000);
  pdf.save(
    `${event.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_qr_code.pdf`,
  );
};
