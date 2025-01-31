// Iska itna saa kam hai asynchronous errors ko handle kerna or unhe express.js ke middleware tak pass kerna 
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }

// if an error happens, it is passed to the next(), which triggers express's built-in error-handling middleware
//agar next() ko call nhi kiya to server crash ho jayega 
// sirf ek error throw karta hai, server ko crash nahi karta agar tumne usse handle kiya ho.
// Agar error ko handle nahi kiya gaya, toh server crash kar jayega.