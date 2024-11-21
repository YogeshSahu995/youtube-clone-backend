const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

// if an error happens, it is passed to the next(), which triggers express's built-in error-handling middleware
export { asyncHandler }
