const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_'))
});

const pdfOnly = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('PDF only'));
  cb(null, true);
};

const imageOnly = (req, file, cb) => {
  if (!/^image\//.test(file.mimetype)) return cb(new Error('Image only'));
  cb(null, true);
};

exports.uploadResume = multer({ storage, fileFilter: pdfOnly }).single('resume');
exports.uploadPhoto  = multer({ storage, fileFilter: imageOnly }).single('photo');
