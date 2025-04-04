import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const isValidType =
    filetypes.test(file.mimetype) &&
    filetypes.test(path.extname(file.originalname).toLowerCase());
  isValidType ? cb(null, true) : cb(new Error("Only image files allowed!"));
};

const upload = multer({ storage, fileFilter });

export default upload;
