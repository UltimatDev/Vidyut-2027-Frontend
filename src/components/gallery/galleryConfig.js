const imageModules = import.meta.glob(
  './images/*.{png,jpg,jpeg,webp,avif,gif,PNG,JPG,JPEG,WEBP,AVIF,GIF}',
  {
    eager: true,
    query: { w: 1200, format: 'webp', quality: 82 },
    import: 'default'
  }
);

export const GALLERY_ITEMS = Object.entries(imageModules)
  .sort(([pathA], [pathB]) =>
    pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' })
  )
  .map(([path, src], index) => ({
    id: `vidyut-frame-${index}-${path.split('/').pop()}`,
    image: src
  }));

export const TICKER_TOP = 'VIDYUT ARCHIVES • MOMENTS • REVEL • ';
export const TICKER_BOTTOM = 'CULTURE • STAGE • FRAMES • ENERGY • ';