import fs from "fs";
import path from "path";
import multer from "multer";
import crypto from "crypto";

const uploadDir = path.resolve("./temp");

// Create temp directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        cb(null, uniqueName);
    }

});

const fileFilter = (req, file, cb) => {

    const allowedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, JPG, PNG, WEBP and GIF files are allowed."));
    }

};

const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

export default upload;