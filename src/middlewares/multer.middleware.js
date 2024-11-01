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
Multer ka kaam yahi hai ki jo file upload ho rahi hai, us par zaroori rok-tok (restrictions) lagaye aur us file ka object route ke req (request) mein add kar de. Ye object us file ki details rakhta hai, jese:

Original name (file ka asli naam),
Encoding (file kis tarah se encoded hai),
Mimetype (file ka type, jaise image/jpeg ya image/png),
Destination path (kahan save hui hai),
Filename (server pe unique filename),
Size (file ka size in bytes).
Multer ye data frontend se leti hai aur backend ke req object me store karti hai. Phir backend me hum us file ko access kar sakte hain aur us par processing kar sakte hain, jaise save karna, delete karna, ya database me entry banana.

Ek aur cheez: Multer se hum ye bhi control kar sakte hain ki kaun se files allow hain (jaise sirf images), unka maximum size kya hona chahiye, aur file kaha save hogi (memory me ya disk pe).

Multer frontend aur backend ke beech ek bridge ki tarah kaam karta hai jo file upload process ko easy aur safe banata hai.
*/
