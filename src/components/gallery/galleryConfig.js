const imageModules = import.meta.glob(
  './images/*.{png,jpg,jpeg,webp,avif,gif,PNG,JPG,JPEG,WEBP,AVIF,GIF}',
  { eager: true, import: 'default' }
);

const loadedFolderImages = Object.entries(imageModules)
  .sort(([pathA], [pathB]) =>
    pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' })
  )
  .map(([path, src], index) => ({
    id: `local-img-${index}-${path.split('/').pop()}`,
    image: src
  }));

const EMPTY_FOLDER_PLACEHOLDERS = Array.from({ length: 7 }, (_, i) => ({
  id: `placeholder-${i}`,
  image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%2323140e'/%3E%3Cstop offset='100%25' stop-color='%230c0908'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3C/svg%3E`
}));

export const GALLERY_IMAGES =
  loadedFolderImages.length > 0 ? loadedFolderImages : EMPTY_FOLDER_PLACEHOLDERS;

export const MARQUEE_ROWS = [
  {
    text: 'VIDYUT • MOMENTS • ARCHIVE • VIDYUT • ',
    style: 'outline',
    direction: 'left',
    duration: 44
  },
  {
    text: 'CULTURE • ENERGY • FRAMES • CULTURE • ',
    style: 'ghost',
    direction: 'right',
    duration: 52
  },
  {
    text: 'VIDYUT • LIVE • MEMORIES • VIDYUT • ',
    style: 'fine',
    direction: 'left',
    duration: 40
  }
];