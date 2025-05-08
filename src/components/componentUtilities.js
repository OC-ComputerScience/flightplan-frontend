export const loadImage = (image) => {
  if (!image || !image.data) return;

  // Ensure image.data is a Uint8Array
  const byteArray = new Uint8Array(image.data);

  const blob = new Blob([byteArray], { type: image.type }); // Adjust type accordingly
  return URL.createObjectURL(blob);
};

export const cleanupImage = (objectURL) => {
  if (objectURL) {
    URL.revokeObjectURL(objectURL);
  }
};
