const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
               .catch((err) => next(err)) // Pass any errors to Express's default error handler
    }
}

export{ asyncHandler }






// const asyncHandler = (func) => { return async() => {}}
/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next) // fn is typically a route handler in Express
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
        // where the error is caught, and a response is sent back with the appropriate status code and error message.
    }
}
*/

// Why Use asyncHandler?
// Without this pattern, you'd have to add try-catch blocks manually in every route handler to handle errors in asynchronous functions. By using this middleware, it centralizes error handling for asynchronous routes and makes your code cleaner and more maintainable.
