import multer from "multer"

const storage = multer.diskStorage(
    {
        destination: function(req, file, cb){
            cb(null, "./public/temp")
        },
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)

export const upload = multer({storage}) //es6 use :- {storage: storage} not any problem
/*
If you want more control over your uploads, you"ll want to use the storage option instead of dest. Multer ships with storage engines DiskStorage and MemoryStorage; More engines are available from third parties.
upload.single()

app.post("/upload", upload.single("profilePic"), (req, res) => {
  console.log(req.file); // access the uploaded file
  res.send("File uploaded successfully!");
});
*/
