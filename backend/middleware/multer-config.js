const multer = require('multer');
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

function cleanFileName(fileName) {
 const cleanedName = fileName
   .replace(/[\/\\\:\*\?"<>\|\0]/g, '_') 
   .replace(/\s+/g, '_') 
   .replace(/\.\.+/g, '.') 
   .substring(0, 255); 

 return cleanedName.substring(0, cleanedName.lastIndexOf('.') || cleanedName.length);
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const newFileName = cleanFileName(file.originalname);
    const extension = MIME_TYPES[file.mimetype];
    if (extension) {
       callback(null, `${newFileName}_${Date.now()}.${extension}`);
    } else {
      callback(new Error('Invalid file type'));
    }
  }
});

module.exports = multer({ storage }).single('image');