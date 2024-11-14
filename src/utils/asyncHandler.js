const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

// if an error happens, it is passed to the next(), which triggers express's built-in error-handling middleware
export { asyncHandler }


/*
// asyncHandler is a Higher order function (a function that take function as an argument and returns another a new funtion)
// fn :- is your asynchronous route handler that might return a promise

// const asyncHandler = (fn) => {() => {}}

    const asyncHandler = (fn) => async(req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            res.status(err.code || 500).json({
                success: false,
                message: err.message
            })
        }
    }

// This helps you avoid writing repetitive try-catch blocks in every async route handler, making the code cleaner and easier to manage. EXAMPLE:-

    app.get('/example', asyncHandler(async (req, res) => {
        const data = await someAsyncFunction();
        res.json(data);
    }));
*/